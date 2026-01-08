const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tagSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Tag name is required'],
    trim: true,
    maxlength: [50, 'Tag name cannot be longer than 50 characters'],
    minlength: [1, 'Tag name cannot be empty']
  },
  color: {
    type: String,
    default: '#3f51b5',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: props => `${props.value} is not a valid hex color!`
    }
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // Keep optional to support public notebooks
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  notebooks: [{
    type: Schema.Types.ObjectId,
    ref: 'Notebook'
  }],
  description: {
    type: String,
    maxlength: [200, 'Description cannot be longer than 200 characters'],
    default: ''
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create unique compound index for tag name per user
tagSchema.index({ name: 1, createdBy: 1 }, { unique: true });

// Index for text search
tagSchema.index({ name: 'text', description: 'text' });

// Virtual for notebook count
tagSchema.virtual('notebookCount').get(function() {
  return this.notebooks.length;
});

// Methods
tagSchema.methods.isOwnedBy = function(userId) {
  return this.createdBy && this.createdBy.toString() === userId.toString();
};

tagSchema.methods.addNotebook = function(notebookId) {
  if (!this.notebooks.includes(notebookId)) {
    this.notebooks.push(notebookId);
    return this.save();
  }
  return Promise.resolve(this);
};

tagSchema.methods.removeNotebook = function(notebookId) {
  const index = this.notebooks.indexOf(notebookId);
  if (index > -1) {
    this.notebooks.splice(index, 1);
    return this.save();
  }
  return Promise.resolve(this);
};

// Update timestamps on save
tagSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static methods
tagSchema.statics.findByUser = function(userId, includePublic = true) {
  const query = includePublic ? 
    { $or: [{ createdBy: userId }, { isPublic: true }] } :
    { createdBy: userId };
  return this.find(query).sort('name');
};

tagSchema.statics.findByUserAndName = function(userId, name) {
  return this.findOne({
    createdBy: userId,
    name: new RegExp(`^${name}$`, 'i')
  });
};

tagSchema.statics.searchByUser = function(userId, searchText, includePublic = true, limit = 10) {
  const query = {
    $and: [
      { $or: [{ createdBy: userId }, ...(includePublic ? [{ isPublic: true }] : [])] },
      { $text: { $search: searchText } }
    ]
  };
  
  return this.find(query)
    .limit(limit)
    .sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('Tag', tagSchema);