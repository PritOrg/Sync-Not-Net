const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 2000
  },
  notebookId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Notebook', 
    required: true 
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false // Optional for guest comments
  },
  guestAuthor: {
    name: { 
      type: String,
      trim: true,
      maxlength: 50
    },
    email: { 
      type: String,
      trim: true,
      maxlength: 100,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    }
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null // For nested comments/replies
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  edited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Middleware to mark comments as edited when updated
commentSchema.pre('save', function(next) {
  if (!this.isNew && this.isModified('content')) {
    this.edited = true;
  }
  next();
});

// Ensure either author or guestAuthor is provided
commentSchema.pre('validate', function(next) {
  if (!this.author && !this.guestAuthor?.name) {
    next(new Error('Either author or guestAuthor.name is required'));
  }
  next();
});

// Virtual to get formatted date
commentSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleString();
});

// Virtual to get author info consistently
commentSchema.virtual('authorInfo').get(function() {
  if (this.author) {
    return {
      id: this.author._id,
      name: this.author.name,
      email: this.author.email,
      isGuest: false
    };
  }
  return {
    name: this.guestAuthor.name,
    email: this.guestAuthor.email,
    isGuest: true
  };
});

// Methods
commentSchema.methods.isOwnedBy = function(userId) {
  return this.author && this.author.toString() === userId.toString();
};

commentSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  
  // Add formatted date and author info
  obj.formattedDate = this.formattedDate;
  obj.authorInfo = this.authorInfo;
  
  return obj;
};

// Static methods
commentSchema.statics.findByNotebook = function(notebookId) {
  return this.find({ notebookId })
    .populate('author', 'name email')
    .sort('-createdAt');
};

module.exports = mongoose.model('Comment', commentSchema);
