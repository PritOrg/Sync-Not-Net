const mongoose = require('mongoose');

const collaborationRequestSchema = new mongoose.Schema({
  notebookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notebook',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    maxlength: 500,
    default: ''
  },
  requestedAccess: {
    type: String,
    enum: ['read', 'write', 'admin'],
    default: 'write'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Prevent duplicate pending requests for the same notebook from the same sender
collaborationRequestSchema.index(
  { notebookId: 1, senderId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

// Index for efficient querying of incoming/outgoing requests
collaborationRequestSchema.index({ receiverId: 1, status: 1, createdAt: -1 });
collaborationRequestSchema.index({ senderId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('CollaborationRequest', collaborationRequestSchema);
