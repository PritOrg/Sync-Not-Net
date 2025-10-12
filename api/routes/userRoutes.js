const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { catchAsync } = require('../middlewares/errorHandler');
const {
  validateUserRegistration,
  validateUserLogin,
  validateUserSearch,
  validateObjectId
} = require('../middlewares/validation');
const { verifyToken } = require('../middlewares/verifyToken');
const logger = require('../utils/logger');

// Get user profile (authenticated route)
router.get('/profile', verifyToken, catchAsync(async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch user profile'
    });
  }
}));

// JWT configuration from environment
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Register User with enhanced validation and security
router.post('/register', validateUserRegistration, catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      error: 'User already exists',
      message: 'An account with this email already exists'
    });
  }

  // Create new user (password will be hashed by the pre-save middleware)
  const newUser = new User({ name, email, password });
  await newUser.save();

  // Generate JWT token
  const token = jwt.sign(
    {
      id: newUser._id,
      email: newUser.email,
      role: newUser.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  logger.info(`New user registered: ${email}`);

  res.status(201).json({
    token,
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    },
    message: 'User registered successfully'
  });
}));
// Login User with enhanced security
router.post('/login', validateUserLogin, catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Find the user by email
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    logger.warn(`Login attempt with non-existent email: ${email}`);
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid email or password'
    });
  }

  // Check if account is locked
  if (user.isLocked()) {
    const remainingTime = Math.ceil((user.lockoutUntil - new Date()) / 1000 / 60);
    return res.status(423).json({
      error: 'Account locked',
      message: `Account is temporarily locked. Please try again in ${remainingTime} minutes.`
    });
  }

  // Compare the provided password with the hashed password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.handleFailedLogin();
    logger.warn(`Failed login attempt for email: ${email}`);
    
    // If account just got locked, send specific message
    if (user.isLocked()) {
      const lockoutMinutes = Math.ceil((user.lockoutUntil - new Date()) / 1000 / 60);
      return res.status(423).json({
        error: 'Account locked',
        message: `Too many failed attempts. Account locked for ${lockoutMinutes} minutes.`
      });
    }

    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid email or password'
    });
  }

  // Reset failed login attempts on successful login
  await user.resetFailedLogins();

  // Generate JWT token with additional claims
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: JWT_EXPIRES_IN,
      audience: process.env.NODE_ENV === 'production' ? process.env.CORS_ORIGIN : 'localhost'
    }
  );

  logger.info(`User logged in: ${email}`);

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    message: 'Login successful'
  });
}));

// Search for collaborators with enhanced security and validation
router.get('/search', verifyToken, validateUserSearch, catchAsync(async (req, res) => {
  const { query } = req.query;

  // Create case-insensitive regex for search
  const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  // Find users matching the search query (exclude current user)
  const users = await User.find({
    $and: [
      { _id: { $ne: req.userId } }, // Exclude current user
      {
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      }
    ]
  })
  .select('name email role')
  .limit(20) // Limit results to prevent abuse
  .sort({ name: 1 });

  res.json({
    users,
    total: users.length,
    query
  });
}));

// Search users for collaboration
router.get('/search', verifyToken, catchAsync(async (req, res) => {
  const { q: query, limit = 10 } = req.query;

  if (!query || query.trim().length < 2) {
    return res.json({ users: [] });
  }

  const searchRegex = new RegExp(query.trim(), 'i');
  
  const users = await User.find({
    _id: { $ne: req.user.id }, // Exclude current user
    $or: [
      { name: searchRegex },
      { email: searchRegex }
    ]
  })
  .select('_id name email avatar')
  .limit(parseInt(limit))
  .sort({ name: 1 });

  res.json({
    users: users.map(user => ({
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar
    }))
  });
}));

// Search users (authenticated route)
router.get('/search', verifyToken, catchAsync(async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        error: 'Invalid search query',
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Search users by name or email (case-insensitive)
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user.id } }, // Exclude current user
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('_id name email avatar')
    .limit(10);

    res.json(users);
  } catch (error) {
    logger.error('Error searching users:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to search users'
    });
  }
}));

// Get User by ID with enhanced security
router.get('/find/:id', verifyToken, validateObjectId, catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: 'The requested user does not exist'
    });
  }

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }
  });
}));

// Get current user profile
router.get('/profile', verifyToken, catchAsync(async (req, res) => {
  const user = await User.findById(req.userId).select('-password');

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: 'User profile not found'
    });
  }

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  });
}));

// Update user profile (authenticated route)
router.put('/profile', verifyToken, catchAsync(async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Name and email are required'
      });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: req.user.id } 
    });
    
    if (existingUser) {
      return res.status(400).json({
        error: 'Email already exists',
        message: 'This email is already registered to another account'
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        name: name.trim(),
        email: email.trim().toLowerCase(),
        updatedAt: new Date()
      },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    logger.info(`User profile updated: ${email}`);

    res.json({
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update user profile'
    });
  }
}));

// Change password (authenticated route)
router.put('/password', verifyToken, catchAsync(async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Current password and new password are required'
      });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.findByIdAndUpdate(req.user.id, {
      password: hashedPassword,
      updatedAt: new Date()
    });

    logger.info(`Password changed for user: ${user.email}`);

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Error changing password:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to change password'
    });
  }
}));

// Get user statistics (authenticated route)
router.get('/stats', verifyToken, catchAsync(async (req, res) => {
  try {
    const Notebook = require('../models/notebookModel');
    
    // Get user's notebooks statistics
    const totalNotebooks = await Notebook.countDocuments({ owner: req.user.id });
    const sharedNotebooks = await Notebook.countDocuments({ 
      'collaborators.user': req.user.id 
    });
    
    // Get public notebooks created by user
    const publicNotebooks = await Notebook.countDocuments({ 
      owner: req.user.id,
      'permissions.public': 'edit'
    });

    // Get total collaborators across all owned notebooks
    const ownedNotebooks = await Notebook.find({ owner: req.user.id });
    const totalCollaborators = ownedNotebooks.reduce((total, notebook) => {
      return total + (notebook.collaborators ? notebook.collaborators.length : 0);
    }, 0);

    res.json({
      stats: {
        totalNotebooks,
        sharedNotebooks,
        publicNotebooks,
        totalCollaborators,
        memberSince: await User.findById(req.user.id).select('createdAt').then(u => u.createdAt)
      }
    });
  } catch (error) {
    logger.error('Error fetching user stats:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch user statistics'
    });
  }
}));

// Get all users (admin only - for future use)
router.get('/', verifyToken, catchAsync(async (req, res) => {
  // Check if user is admin (for future role-based access)
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin access required'
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments();

  res.json({
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

module.exports = router;

