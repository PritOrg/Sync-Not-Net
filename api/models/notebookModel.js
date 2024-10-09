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
  


module.exports = mongoose.model('Notebook', notebookModel);
