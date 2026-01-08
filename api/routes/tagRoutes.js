const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Tag = require('../models/tagModel');
const Notebook = require('../models/notebookModel');

const { optionalAuth, verifyToken } = require('../middlewares/verifyToken');
const { catchAsync } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

const { validateTagCreation, validateTagUpdate, validateTagSearch, validateObjectId } = require('../middlewares/validation');

// List all tags with optional auth support
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get tags created by the user
    const tags = await Tag.find({ createdBy: userId })
      .sort({ name: 1 })
      .select('_id name color notebooks');
    
    return res.status(200).json({ tags });
  } catch (error) {
    logger.error(`Error getting tags: ${error.message}`);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new tag
router.post('/', verifyToken, validateTagCreation, async (req, res) => {
  try {
    const { name, color } = req.body;
    const userId = req.user.id;
    
    // Validate tag name
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Tag name is required' });
    }
    
    if (name.trim().length > 50) {
      return res.status(400).json({ message: 'Tag name must be less than 50 characters' });
    }
    
    // Check if tag already exists for this user
    const existingTag = await Tag.findOne({
      name: name.trim(),
      createdBy: userId
    });
    
    if (existingTag) {
      return res.status(400).json({ message: 'Tag already exists' });
    }
    
    // Create the new tag
    const newTag = new Tag({
      name: name.trim(),
      color: color || '#3f51b5',
      createdBy: userId,
      notebooks: []
    });
    
    await newTag.save();
    
    return res.status(201).json({
      message: 'Tag created successfully',
      tag: {
        _id: newTag._id,
        name: newTag.name,
        color: newTag.color,
        notebooks: []
      }
    });
  } catch (error) {
    logger.error(`Error creating tag: ${error.message}`);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a tag
router.put('/:tagId', verifyToken, validateTagUpdate, async (req, res) => {
  try {
    const { tagId } = req.params;
    const { name, color } = req.body;
    const userId = req.user.id;
    
    // Validate tag name
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Tag name is required' });
    }
    
    if (name.trim().length > 50) {
      return res.status(400).json({ message: 'Tag name must be less than 50 characters' });
    }
    
    // Find the tag
    const tag = await Tag.findById(tagId);
    
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    
    // Check if user owns the tag
    if (tag.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this tag' });
    }
    
    // Check if new name already exists for this user (except for this tag)
    if (name.trim() !== tag.name) {
      const existingTag = await Tag.findOne({
        name: name.trim(),
        createdBy: userId,
        _id: { $ne: tagId }
      });
      
      if (existingTag) {
        return res.status(400).json({ message: 'Another tag with this name already exists' });
      }
    }
    
    // Update the tag
    tag.name = name.trim();
    if (color) tag.color = color;
    tag.updatedAt = Date.now();
    
    await tag.save();
    
    return res.status(200).json({
      message: 'Tag updated successfully',
      tag: {
        _id: tag._id,
        name: tag.name,
        color: tag.color,
        notebooks: tag.notebooks
      }
    });
  } catch (error) {
    logger.error(`Error updating tag: ${error.message}`);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a tag
router.delete('/:tagId', verifyToken, validateObjectId, async (req, res) => {
  try {
    const { tagId } = req.params;
    const userId = req.user.id;
    
    // Find the tag
    const tag = await Tag.findById(tagId);
    
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    
    // Check if user owns the tag
    if (tag.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this tag' });
    }
    
    // Remove tag from all notebooks
    await Notebook.updateMany(
      { tags: tagId },
      { $pull: { tags: tagId } }
    );
    
    // Delete the tag
    await Tag.findByIdAndDelete(tagId);
    
    return res.status(200).json({ message: 'Tag deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting tag: ${error.message}`);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add tag to a notebook
router.post('/notebooks/:notebookId/tags/:tagId', verifyToken, async (req, res) => {
  try {
    const { notebookId, tagId } = req.params;
    const userId = req.user.id;
    
    // Check if notebook exists and user has access
    const notebook = await Notebook.findOne({ _id: notebookId });
    
    if (!notebook) {
      return res.status(404).json({ message: 'Notebook not found' });
    }
    
    // Check if user has write access to the notebook
    // This is a simplified check - you'd want to expand this based on your permissions model
    if (notebook.creatorID.toString() !== userId) {
      const hasCollaboratorAccess = notebook.collaborators?.some(
        collab => collab.userId.toString() === userId && collab.access === 'write'
      );
      
      if (!hasCollaboratorAccess) {
        return res.status(403).json({ message: 'Not authorized to add tags to this notebook' });
      }
    }
    
    // Check if tag exists and belongs to user
    const tag = await Tag.findOne({
      _id: tagId,
      createdBy: userId
    });
    
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found or not authorized' });
    }
    
    // Add tag to notebook if not already present
    if (!notebook.tags.includes(tagId)) {
      notebook.tags.push(tagId);
      await notebook.save();
    }
    
    // Add notebook to tag's notebook list if not already present
    if (!tag.notebooks.includes(notebookId)) {
      tag.notebooks.push(notebookId);
      await tag.save();
    }
    
    return res.status(200).json({ message: 'Tag added to notebook successfully' });
  } catch (error) {
    logger.error(`Error adding tag to notebook: ${error.message}`);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove tag from a notebook
router.delete('/notebooks/:notebookId/tags/:tagId', verifyToken, async (req, res) => {
  try {
    const { notebookId, tagId } = req.params;
    const userId = req.user.id;
    
    // Check if notebook exists and user has access
    const notebook = await Notebook.findOne({ _id: notebookId });
    
    if (!notebook) {
      return res.status(404).json({ message: 'Notebook not found' });
    }
    
    // Check if user has write access to the notebook
    if (notebook.creatorID.toString() !== userId) {
      const hasCollaboratorAccess = notebook.collaborators?.some(
        collab => collab.userId.toString() === userId && collab.access === 'write'
      );
      
      if (!hasCollaboratorAccess) {
        return res.status(403).json({ message: 'Not authorized to remove tags from this notebook' });
      }
    }
    
    // Remove tag from notebook
    notebook.tags = notebook.tags.filter(
      tag => tag.toString() !== tagId
    );
    await notebook.save();
    
    // Remove notebook from tag's notebook list
    await Tag.updateOne(
      { _id: tagId },
      { $pull: { notebooks: notebookId } }
    );
    
    return res.status(200).json({ message: 'Tag removed from notebook successfully' });
  } catch (error) {
    logger.error(`Error removing tag from notebook: ${error.message}`);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single tag by ID
router.get('/:tagId', verifyToken, async (req, res) => {
  try {
    const { tagId } = req.params;
    const userId = req.user.id;
    
    const tag = await Tag.findOne({
      _id: tagId,
      createdBy: userId
    });
    
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found or not authorized' });
    }
    
    return res.status(200).json({
      tag: {
        _id: tag._id,
        name: tag.name,
        color: tag.color,
        notebooks: tag.notebooks
      }
    });
  } catch (error) {
    logger.error(`Error getting tag: ${error.message}`);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all notebooks with a specific tag
router.get('/:tagId/notebooks', verifyToken, async (req, res) => {
  try {
    const { tagId } = req.params;
    const userId = req.user.id;
    
    // Check if tag exists and belongs to user
    const tag = await Tag.findOne({
      _id: tagId,
      createdBy: userId
    });
    
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found or not authorized' });
    }
    
    // Get all notebooks with this tag
    const notebooks = await Notebook.find({
      tags: tagId,
      $or: [
        { creatorID: userId },
        { 'collaborators.userId': userId }
      ]
    })
    .select('_id title urlIdentifier updatedAt creatorID')
    .populate('creatorID', 'name email');
    
    return res.status(200).json({
      tag: {
        _id: tag._id,
        name: tag.name,
        color: tag.color
      },
      notebooks
    });
  } catch (error) {
    logger.error(`Error getting notebooks by tag: ${error.message}`);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Enhanced search with filters
router.get('/search', verifyToken, validateTagSearch, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      query,
      tags,
      dateFrom,
      dateTo,
      sortBy = 'updated',
      sortOrder = 'desc',
      onlyMine = false,
      onlyShared = false,
      page = 1,
      limit = 10
    } = req.query;
    
    // Build the filter
    const filter = {};
    
    // Access control filter
    if (onlyMine && onlyShared) {
      // If both are selected, show all accessible notebooks
      filter.$or = [
        { creatorID: userId },
        { 'collaborators.userId': userId }
      ];
    } else if (onlyMine) {
      // Only show notebooks created by the user
      filter.creatorID = userId;
    } else if (onlyShared) {
      // Only show notebooks shared with the user
      filter['collaborators.userId'] = userId;
    } else {
      // Default: show all accessible notebooks
      filter.$or = [
        { creatorID: userId },
        { 'collaborators.userId': userId }
      ];
    }
    
    // Text search
    if (query && query.trim()) {
      filter.$text = { $search: query.trim() };
    }
    
    // Tags filter
    if (tags && tags.length > 0) {
      const tagIds = tags.split(',').filter(id => mongoose.Types.ObjectId.isValid(id));
      if (tagIds.length > 0) {
        filter.tags = { $all: tagIds };
      }
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      filter.updatedAt = {};
      if (dateFrom) {
        filter.updatedAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.updatedAt.$lte = new Date(dateTo);
      }
    }
    
    // Determine sort field
    let sortField = 'updatedAt';
    if (sortBy === 'created') sortField = 'createdAt';
    if (sortBy === 'title') sortField = 'title';
    
    // Determine sort direction
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    // Build sort object
    const sort = { [sortField]: sortDirection };
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Execute query
    const notebooks = await Notebook.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('_id title urlIdentifier updatedAt createdAt content tags creatorID collaborators')
      .populate('creatorID', 'name email')
      .populate('tags', 'name color');
    
    // Get total count for pagination
    const totalCount = await Notebook.countDocuments(filter);
    
    return res.status(200).json({
      notebooks,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    logger.error(`Error searching notebooks: ${error.message}`);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;