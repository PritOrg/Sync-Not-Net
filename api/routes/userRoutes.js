const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { catchAsync } = require('../middlewares/errorHandler');
const {
  validateUserRegistration,
  validateUserLogin,
  validateObjectId
} = require('../middlewares/validation');
const { verifyToken } = require('../middlewares/verifyToken');
const logger = require('../utils/logger');
const config = require('../config');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role || 'user',
  profilePicture: user.profilePicture,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Get user profile
router.get('/profile', verifyToken, catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    return res.status(404).json({ error: 'User not found', message: 'User profile not found' });
  }
  res.json({ user: sanitizeUser(user) });
}));

// Register
router.post('/register', validateUserRegistration, catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
  if (existingUser) {
    return res.status(409).json({
      error: 'User already exists',
      message: 'An account with this email already exists',
    });
  }

  const newUser = new User({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
  });
  await newUser.save();

  const token = generateToken(newUser);

  logger.info(`New user registered: ${newUser.email}`);

  res.status(201).json({
    token,
    user: sanitizeUser(newUser),
    message: 'Account created successfully',
  });
}));

// Login
router.post('/login', validateUserLogin, catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    logger.warn(`Login attempt with non-existent email: ${normalizedEmail}`);
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid email or password',
    });
  }

  if (user.isLocked && user.isLocked()) {
    const remainingMs = user.lockoutUntil - Date.now();
    const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
    return res.status(423).json({
      error: 'Account locked',
      message: `Account temporarily locked. Try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`,
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    if (user.handleFailedLogin) {
      await user.handleFailedLogin();
    }
    logger.warn(`Failed login attempt for: ${normalizedEmail}`);

    if (user.isLocked && user.isLocked()) {
      const lockoutMinutes = Math.ceil((user.lockoutUntil - Date.now()) / 60000);
      return res.status(423).json({
        error: 'Account locked',
        message: `Too many failed attempts. Account locked for ${lockoutMinutes} minute${lockoutMinutes > 1 ? 's' : ''}.`,
      });
    }

    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid email or password',
    });
  }

  if (user.resetFailedLogins) {
    await user.resetFailedLogins();
  }

  const token = generateToken(user);

  logger.info(`User logged in: ${normalizedEmail}`);

  res.json({
    token,
    user: sanitizeUser(user),
    message: 'Login successful',
  });
}));

// Search users
router.get('/search', verifyToken, catchAsync(async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({
      error: 'Invalid search query',
      message: 'Search query must be at least 2 characters',
    });
  }

  const users = await User.find({
    $and: [
      { _id: { $ne: req.user.id } },
      {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ],
      },
    ],
  })
    .select('_id name email avatar')
    .limit(10);

  res.json(users);
}));

// Get user by ID
router.get('/find/:id', verifyToken, validateObjectId, catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: 'The requested user does not exist',
    });
  }
  res.json({ user: sanitizeUser(user) });
}));

// Update profile
router.put('/profile', verifyToken, catchAsync(async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Name and email are required',
    });
  }

  const trimmedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (trimmedName.length < 2) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Name must be at least 2 characters',
    });
  }

  const existingUser = await User.findOne({
    email: normalizedEmail,
    _id: { $ne: req.user.id },
  });

  if (existingUser) {
    return res.status(409).json({
      error: 'Email taken',
      message: 'This email is already registered to another account',
    });
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { name: trimmedName, email: normalizedEmail, updatedAt: new Date() },
    { new: true, select: '-password' }
  );

  if (!updatedUser) {
    return res.status(404).json({
      error: 'User not found',
      message: 'User profile not found',
    });
  }

  logger.info(`Profile updated: ${normalizedEmail}`);

  res.json({
    user: sanitizeUser(updatedUser),
    message: 'Profile updated successfully',
  });
}));

// Change password
router.put('/password', verifyToken, catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Current password and new password are required',
    });
  }

  if (newPassword.length < config.security.passwordMinLength) {
    return res.status(400).json({
      error: 'Validation error',
      message: `New password must be at least ${config.security.passwordMinLength} characters`,
    });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'New password must be different from current password',
    });
  }

  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: 'User account not found',
    });
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return res.status(400).json({
      error: 'Invalid password',
      message: 'Current password is incorrect',
    });
  }

  user.password = newPassword;
  user.updatedAt = new Date();
  await user.save();

  logger.info(`Password changed for: ${user.email}`);

  res.json({ message: 'Password changed successfully' });
}));

// Get user stats
router.get('/stats', verifyToken, catchAsync(async (req, res) => {
  const Notebook = require('../models/notebookModel');

  const totalNotebooks = await Notebook.countDocuments({ creatorID: req.user.id });
  const sharedNotebooks = await Notebook.countDocuments({
    'collaborators.userId': req.user.id,
  });
  const publicNotebooks = await Notebook.countDocuments({
    creatorID: req.user.id,
    permissions: 'everyone',
  });

  const ownedNotebooks = await Notebook.find({ creatorID: req.user.id }).select('collaborators.userId');
  const uniqueCollaboratorIds = new Set();

  ownedNotebooks.forEach((nb) => {
    (nb.collaborators || []).forEach((collab) => {
      const collabId = collab?.userId?.toString();
      if (collabId) {
        uniqueCollaboratorIds.add(collabId);
      }
    });
  });

  const totalCollaborators = uniqueCollaboratorIds.size;

  const user = await User.findById(req.user.id).select('createdAt lastLogin profilePicture');

  res.json({
    stats: {
      totalNotebooks,
      sharedNotebooks,
      publicNotebooks,
      totalCollaborators,
      memberSince: user?.createdAt,
      lastLogin: user?.lastLogin,
      profilePicture: user?.profilePicture,
    },
  });
}));

// Get user activity
router.get('/activity', verifyToken, catchAsync(async (req, res) => {
  const Notebook = require('../models/notebookModel');

  const limit = parseInt(req.query.limit, 10) || 5;
  
  // Find notebooks where user is owner or collaborator, sorted by updatedAt descending
  const notebooks = await Notebook.find({
    $or: [
      { creatorID: req.user.id },
      { 'collaborators.userId': req.user.id },
    ],
  })
    .select('title permissions updatedAt collaborators creatorID')
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();

  const activity = notebooks.map(nb => ({
    id: nb._id,
    title: nb.title,
    updatedAt: nb.updatedAt,
    isOwner: nb.creatorID.toString() === req.user.id,
    accessLevel: nb.creatorID.toString() === req.user.id 
      ? 'owner' 
      : nb.collaborators.find(c => c.userId.toString() === req.user.id)?.access || 'read',
    isPublic: nb.permissions === 'everyone',
  }));

  res.json({ activity });
}));

// Get all users (admin only)
router.get('/', verifyToken, catchAsync(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin access required',
    });
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ]);

  res.json({
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

module.exports = router;
