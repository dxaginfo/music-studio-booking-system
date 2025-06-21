const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all bookings with filtering options
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllBookings = async (req, res) => {
  try {
    const { 
      studioId, 
      engineerId, 
      clientId, 
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;
    
    // Build filter object
    const filter = {};
    if (studioId) filter.studioId = studioId;
    if (engineerId) filter.engineerId = engineerId;
    if (clientId) filter.clientId = clientId;
    if (status) filter.status = status;
    
    // Add date range filter if provided
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.gte = new Date(startDate);
      if (endDate) filter.startTime.lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get bookings
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: filter,
        include: {
          client: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          studio: true,
          engineer: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          sessionType: true,
          bookingEquipment: {
            include: {
              equipment: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: {
          startTime: 'asc',
        },
      }),
      prisma.booking.count({ where: filter }),
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    res.json({
      bookings,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ message: 'Server error retrieving bookings' });
  }
};

/**
 * Get a booking by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        studio: true,
        engineer: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        sessionType: true,
        bookingEquipment: {
          include: {
            equipment: true,
          },
        },
        payments: true,
        files: true,
      },
    });
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({ message: 'Server error retrieving booking' });
  }
};

/**
 * Create a new booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createBooking = async (req, res) => {
  try {
    const {
      clientId,
      studioId,
      engineerId,
      sessionTypeId,
      startTime,
      endTime,
      notes,
      equipment,
    } = req.body;

    // Validate booking times
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Check for overlapping bookings in the same studio
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        studioId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            AND: [
              { startTime: { lte: start } },
              { endTime: { gt: start } },
            ],
          },
          {
            AND: [
              { startTime: { lt: end } },
              { endTime: { gte: end } },
            ],
          },
          {
            AND: [
              { startTime: { gte: start } },
              { endTime: { lte: end } },
            ],
          },
        ],
      },
    });

    if (overlappingBooking) {
      return res.status(409).json({ message: 'There is an overlapping booking for this studio' });
    }

    // Get studio details for pricing
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
    });

    if (!studio) {
      return res.status(404).json({ message: 'Studio not found' });
    }

    // Get session type details for pricing
    const sessionType = await prisma.sessionType.findUnique({
      where: { id: sessionTypeId },
    });

    if (!sessionType) {
      return res.status(404).json({ message: 'Session type not found' });
    }

    // Calculate duration in hours
    const durationHours = (end - start) / (1000 * 60 * 60);

    // Calculate base price
    let totalPrice = studio.hourlyRate * durationHours * sessionType.priceMultiplier;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        clientId,
        studioId,
        engineerId,
        sessionTypeId,
        startTime: start,
        endTime: end,
        status: 'PENDING',
        notes,
        totalPrice,
      },
    });

    // Add equipment if provided
    if (equipment && equipment.length > 0) {
      const bookingEquipmentData = equipment.map((item) => ({
        bookingId: booking.id,
        equipmentId: item.equipmentId,
        quantity: item.quantity,
      }));

      await prisma.bookingEquipment.createMany({
        data: bookingEquipmentData,
      });

      // Update total price with equipment costs
      const equipmentItems = await prisma.equipment.findMany({
        where: {
          id: { in: equipment.map((item) => item.equipmentId) },
        },
      });

      const equipmentCost = equipmentItems.reduce((total, item) => {
        const equipmentItem = equipment.find((e) => e.equipmentId === item.id);
        return total + (item.hourlyRate * durationHours * (equipmentItem?.quantity || 1));
      }, 0);

      totalPrice += equipmentCost;

      // Update booking with final price
      await prisma.booking.update({
        where: { id: booking.id },
        data: { totalPrice },
      });
    }

    // Get full booking with relationships
    const createdBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        studio: true,
        engineer: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        sessionType: true,
        bookingEquipment: {
          include: {
            equipment: true,
          },
        },
      },
    });

    res.status(201).json(createdBooking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error creating booking' });
  }
};

/**
 * Update a booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      engineerId,
      startTime,
      endTime,
      status,
      notes,
    } = req.body;

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Prepare update data
    const updateData = {};
    if (engineerId !== undefined) updateData.engineerId = engineerId;
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // If times are being updated, check for conflicts
    if (startTime || endTime) {
      const start = startTime ? new Date(startTime) : existingBooking.startTime;
      const end = endTime ? new Date(endTime) : existingBooking.endTime;

      if (end <= start) {
        return res.status(400).json({ message: 'End time must be after start time' });
      }

      // Check for overlapping bookings
      const overlappingBooking = await prisma.booking.findFirst({
        where: {
          id: { not: id },
          studioId: existingBooking.studioId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          OR: [
            {
              AND: [
                { startTime: { lte: start } },
                { endTime: { gt: start } },
              ],
            },
            {
              AND: [
                { startTime: { lt: end } },
                { endTime: { gte: end } },
              ],
            },
            {
              AND: [
                { startTime: { gte: start } },
                { endTime: { lte: end } },
              ],
            },
          ],
        },
      });

      if (overlappingBooking) {
        return res.status(409).json({ message: 'There is an overlapping booking for this studio' });
      }

      // Recalculate price if times changed
      if (startTime || endTime) {
        const studio = await prisma.studio.findUnique({
          where: { id: existingBooking.studioId },
        });

        const sessionType = await prisma.sessionType.findUnique({
          where: { id: existingBooking.sessionTypeId },
        });

        const durationHours = (end - start) / (1000 * 60 * 60);
        updateData.totalPrice = studio.hourlyRate * durationHours * sessionType.priceMultiplier;

        // Add equipment costs
        const bookingEquipment = await prisma.bookingEquipment.findMany({
          where: { bookingId: id },
          include: { equipment: true },
        });

        const equipmentCost = bookingEquipment.reduce(
          (total, item) => total + (item.equipment.hourlyRate * durationHours * item.quantity),
          0
        );

        updateData.totalPrice += equipmentCost;
      }
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        studio: true,
        engineer: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        sessionType: true,
        bookingEquipment: {
          include: {
            equipment: true,
          },
        },
      },
    });

    res.json(updatedBooking);
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Server error updating booking' });
  }
};

/**
 * Delete a booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Delete associated booking equipment entries
    await prisma.bookingEquipment.deleteMany({
      where: { bookingId: id },
    });

    // Delete the booking
    await prisma.booking.delete({
      where: { id },
    });

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ message: 'Server error deleting booking' });
  }
};

/**
 * Check studio availability
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.checkAvailability = async (req, res) => {
  try {
    const { studioId, date, startTime, endTime } = req.query;
    
    if (!studioId || !date) {
      return res.status(400).json({ message: 'Studio ID and date are required' });
    }

    // Parse date
    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    // Get all bookings for the studio on the specified date
    const bookings = await prisma.booking.findMany({
      where: {
        studioId,
        startTime: { gte: startOfDay },
        endTime: { lte: endOfDay },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Check specific time slot availability if provided
    let isAvailable = true;
    if (startTime && endTime) {
      const requestStart = new Date(`${date}T${startTime}`);
      const requestEnd = new Date(`${date}T${endTime}`);
      
      isAvailable = !bookings.some(booking => 
        (requestStart < booking.endTime && requestEnd > booking.startTime)
      );
    }
    
    res.json({
      studioId,
      date,
      bookings,
      availableSlots: calculateAvailableSlots(bookings, startOfDay, endOfDay),
      isAvailable,
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ message: 'Server error checking availability' });
  }
};

/**
 * Confirm a booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.confirmBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await prisma.booking.findUnique({
      where: { id },
    });
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.status !== 'PENDING') {
      return res.status(400).json({ message: `Booking cannot be confirmed because it is ${booking.status.toLowerCase()}` });
    }
    
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        studio: true,
        engineer: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        sessionType: true,
      },
    });
    
    // TODO: Send confirmation email to client
    
    res.json(updatedBooking);
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ message: 'Server error confirming booking' });
  }
};

/**
 * Cancel a booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const booking = await prisma.booking.findUnique({
      where: { id },
    });
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.status === 'COMPLETED' || booking.status === 'CANCELED') {
      return res.status(400).json({ message: `Booking cannot be canceled because it is already ${booking.status.toLowerCase()}` });
    }
    
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { 
        status: 'CANCELED',
        notes: reason ? `${booking.notes || ''}\nCancellation reason: ${reason}`.trim() : booking.notes
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        studio: true,
        engineer: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        sessionType: true,
      },
    });
    
    // TODO: Send cancellation email to client
    
    res.json(updatedBooking);
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error canceling booking' });
  }
};

/**
 * Helper function to calculate available time slots
 * @param {Array} bookings - Array of existing bookings
 * @param {Date} startOfDay - Start time of the day
 * @param {Date} endOfDay - End time of the day
 * @returns {Array} Available time slots
 */
function calculateAvailableSlots(bookings, startOfDay, endOfDay) {
  if (bookings.length === 0) {
    return [{
      start: startOfDay,
      end: endOfDay,
    }];
  }

  const slots = [];
  let currentTime = startOfDay;

  // Sort bookings by start time
  bookings.sort((a, b) => a.startTime - b.startTime);

  // Find gaps between bookings
  for (const booking of bookings) {
    if (booking.startTime > currentTime) {
      slots.push({
        start: currentTime,
        end: booking.startTime,
      });
    }
    currentTime = booking.endTime > currentTime ? booking.endTime : currentTime;
  }

  // Add slot after the last booking if needed
  if (currentTime < endOfDay) {
    slots.push({
      start: currentTime,
      end: endOfDay,
    });
  }

  return slots;
}