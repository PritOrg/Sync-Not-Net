const mongoose = require('mongoose');

const notebookVersionSchema = new mongoose.Schema({
  notebookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notebook', required: true, index: true },
  version: { type: Number, required: true },
  content: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

// Index for efficient queries
notebookVersionSchema.index({ notebookId: 1, version: -1 });

module.exports = mongoose.model('NotebookVersion', notebookVersionSchema);
