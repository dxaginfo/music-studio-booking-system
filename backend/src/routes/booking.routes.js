const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Apply authentication to all booking routes
router.use(authenticate);

// Get all bookings
// Admin and managers can see all bookings
// Engineers can see bookings assigned to them
// Clients can see their own bookings
router.get('/', bookingController.getAllBookings);

// Check studio availability
// Public endpoint, doesn't need authentication
router.get('/availability', bookingController.checkAvailability);

// Create a new booking
router.post('/', bookingController.createBooking);

// Get a booking by ID
router.get('/:id', bookingController.getBookingById);

// Update a booking
router.put('/:id', bookingController.updateBooking);

// Delete a booking
// Only admin and managers can delete bookings
router.delete('/:id', authorize(['ADMIN', 'MANAGER']), bookingController.deleteBooking);

// Confirm a booking
// Only admin and managers can confirm bookings
router.post('/:id/confirm', authorize(['ADMIN', 'MANAGER']), bookingController.confirmBooking);

// Cancel a booking
// Anyone can cancel their own booking
router.post('/:id/cancel', bookingController.cancelBooking);

module.exports = router;