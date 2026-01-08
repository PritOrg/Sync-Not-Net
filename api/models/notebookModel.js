const mongoose = require('mongoose');

const notebookModel = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  creatorID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Reference to User
  // permissions: 'everyone' (public), 'private' (creator only), 'collaborators' (owner + collaborators)
  permissions: { type: String, enum: ['everyone', 'private', 'collaborators'], default: 'everyone' },
  collaborators: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    access: { type: String, enum: ['read', 'write'], default: 'read' } 
  }],  // List of collaborators with access level
  password: { type: String }, // Optional password protection
  version: { type: Number, default: 1 },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }], // Reference to Tag model
  editorMode: { type: String, default: 'quill' }, // 'quill' or 'monaco'
  language: { type: String, default: 'javascript' }, // Only relevant if editorMode is 'monaco'
  urlIdentifier: { type: String, unique: true},
  autoSave: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Add indexes for frequently queried fields
notebookModel.index({ urlIdentifier: 1 }, { unique: true });
notebookModel.index({ creatorID: 1 });
notebookModel.index({ updatedAt: -1 });
notebookModel.index({ tags: 1 });
notebookModel.index({ collaborators: 1 });
notebookModel.index({ permissions: 1 });

// Compound index for permissions-based queries
notebookModel.index({ permissions: 1, createdAt: -1 });

module.exports = mongoose.model('Notebook', notebookModel);
