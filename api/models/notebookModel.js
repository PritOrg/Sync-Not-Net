const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const notebookModel = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  creatorID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Reference to User
  permissions: { type: String, enum: ['everyone', 'creator-only'], default: 'everyone' },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  // List of editors
  password: { type: String }, // Optional password protection
  version: { type: Number, default: 1 },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Pre-save hook for hashing the notebook password if it exists
notebookModel.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

module.exports = mongoose.model('Notebook', notebookModel);
