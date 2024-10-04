const mongoose = require('mongoose');

const notebookVersionModel = new mongoose.Schema({
  notebookID: { type: mongoose.Schema.Types.ObjectId, ref: 'Notebook', required: true },
  version: { type: Number, required: true },
  content: { type: String, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Who updated the version
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('NotebookVersion', notebookVersionModel);
