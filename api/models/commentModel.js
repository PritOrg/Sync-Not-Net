const mongoose = require('mongoose');

const commentModel = new mongoose.Schema({
  content: { type: String, required: true },
  userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Reference to User
  notebookID: { type: mongoose.Schema.Types.ObjectId, ref: 'Notebook', required: true },  // Reference to Notebook
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Comment', commentModel);
