const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Secret key for JWT
const JWT_SECRET = 'not_sync_notebook';

// Register User with bcrypt password hashing
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Save new user and retrieve the saved document with its _id
    const newUser = new User({ name, email, password });
    await newUser.save();

    // Use newUser._id for the JWT payload
    const token = jwt.sign(
      { id: newUser._id, email, role: 'editor' },
      JWT_SECRET,
      { expiresIn: '1h' }  // Token expires in 1 hour
    );

    res.status(201).json({ token, message: 'User registered successfully' });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
});
// Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare the provided password with the hashed password in the DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }  // Token expires in 1 hour
    );

    res.json({ token, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search for collaborators
router.get('/search', async (req, res) => {
  const { query } = req.query;
  try {
    const regex = new RegExp(query, 'i'); 
    const users = await User.find({ name: regex }).select('name _id'); // Fetch matching users
    res.json(users); 
  } catch (error) {
    res.status(500).json({ error: 'Server error' }); 
  }
});

// Get User by ID
router.get('/find/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  const users = await User.find();
  res.json(users);
})

module.exports = router;

