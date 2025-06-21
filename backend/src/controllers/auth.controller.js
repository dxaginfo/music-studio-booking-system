const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, userType } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        userType,
      },
    });

    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email, userType: user.userType },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * Login a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email, userType: user.userType },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * Get the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        userType: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error fetching user data' });
  }
};

/**
 * Refresh token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.refreshToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Verify token
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Create new token
      const newToken = jwt.sign(
        { id: user.id, email: user.email, userType: user.userType },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        message: 'Token refreshed successfully',
        token: newToken,
      });
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error refreshing token' });
  }
};

/**
 * Request password reset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create password reset token
    const resetToken = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // TODO: Send email with reset token
    // For now, just return the token in the response
    res.json({
      message: 'Password reset link sent to your email',
      resetToken, // In a real application, this would be sent via email
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error processing request' });
  }
};

/**
 * Reset password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Verify token
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update user password
      await prisma.user.update({
        where: { id: decoded.id },
        data: { password: hashedPassword },
      });

      res.json({ message: 'Password reset successful' });
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error resetting password' });
  }
};