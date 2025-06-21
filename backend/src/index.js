require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const studioRoutes = require('./routes/studio.routes');
const equipmentRoutes = require('./routes/equipment.routes');
const engineerRoutes = require('./routes/engineer.routes');
const sessionTypeRoutes = require('./routes/sessionType.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const fileRoutes = require('./routes/file.routes');
const errorHandler = require('./middlewares/errorHandler');

// Initialize Prisma client
const prisma = new PrismaClient();
global.prisma = prisma;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/studios', studioRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/engineers', engineerRoutes);
app.use('/api/session-types', sessionTypeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/files', fileRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // In a production environment, you might want to gracefully shutdown
  // server.close(() => process.exit(1));
});

module.exports = app;