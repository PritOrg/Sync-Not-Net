const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userModel = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'editor', 'viewer'], default: 'editor' },
  profilePicture: { type: String },
  failedLoginAttempts: { type: Number, default: 0 },
  lockoutUntil: { type: Date },
  lastLogin: { type: Date },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Hash user password before saving
userModel.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Add indexes for performance
userModel.index({ email: 1 }, { unique: true });
userModel.index({ createdAt: -1 });
userModel.index({ role: 1 });

// Method to handle failed login attempts
userModel.methods.handleFailedLogin = async function() {
  this.failedLoginAttempts += 1;
  
  if (this.failedLoginAttempts >= 5) {
    // Lock account for progressively longer periods
    const lockoutMinutes = Math.min(Math.pow(2, this.failedLoginAttempts - 5), 1440); // Max 24 hours
    this.lockoutUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
  }
  
  await this.save();
};

// Method to reset failed login attempts
userModel.methods.resetFailedLogins = async function() {
  if (this.failedLoginAttempts > 0) {
    this.failedLoginAttempts = 0;
    this.lockoutUntil = null;
    this.lastLogin = new Date();
    await this.save();
  }
};

// Method to check if account is locked
userModel.methods.isLocked = function() {
  return this.lockoutUntil && this.lockoutUntil > new Date();
};

// Method to compare passwords
userModel.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userModel);
