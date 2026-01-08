const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Comment = require('../models/commentModel');
const Notebook = require('../models/notebookModel');
const { verifyToken, optionalAuth } = require('../middlewares/verifyToken');
const { validateComment } = require('../middlewares/validation');
const { catchAsync } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

// Get all comments for a notebook
router.get('/notebooks/:notebookId/comments', optionalAuth, catchAsync(async (req, res) => {
  try {
    const { notebookId } = req.params;
    
    // Check if notebook exists
    const notebook = await Notebook.findOne({ _id: notebookId });
    if (!notebook) {
      return res.status(404).json({ message: 'Notebook not found' });
    }
    
    // Get all comments with optional pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Get comments count for pagination
    const totalComments = await Comment.countDocuments({
      notebookId,
      parentId: null // Only count top-level comments
    });

    // Get top-level comments with pagination
    const comments = await Comment.find({ 
      notebookId,
      parentId: null
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'name email')
    .lean();
    
    // For each comment, get its replies
    const commentsWithReplies = await Promise.all(comments.map(async (comment) => {
      const replies = await Comment.find({ parentId: comment._id })
        .sort({ createdAt: 1 })
        .populate('author', 'name email')
        .lean();
      
      return {
        ...comment,
        replies,
        replyCount: replies.length
      };
    }));
    
    return res.status(200).json({
      comments: commentsWithReplies,
      pagination: {
        page,
        pages: Math.ceil(totalComments / limit),
        total: totalComments,
        hasMore: totalComments > page * limit
      }
    });
  } catch (error) {
    logger.error(`Error getting comments: ${error.message}`);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}));

// Add a new comment to a notebook
router.post('/notebooks/:notebookId/comments', optionalAuth, validateComment, catchAsync(async (req, res) => {
  try {
    const { notebookId } = req.params;
    const { content, parentId, guestAuthor } = req.body;
    
    // Check if notebook exists
    const notebook = await Notebook.findOne({ _id: notebookId });
    if (!notebook) {
      return res.status(404).json({ message: 'Notebook not found' });
    }
    
    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    // Check if this is a reply to an existing comment
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
      
      // Ensure the parent comment belongs to the same notebook
      if (parentComment.notebookId.toString() !== notebookId) {
        return res.status(400).json({ message: 'Parent comment does not belong to this notebook' });
      }
    }
    
    // Create comment data
    const commentData = {
      content: content.trim(),
      notebookId,
      parentId: parentId || null
    };
    
    // Add author information
    if (req.user) {
      commentData.author = req.user.id;
    } else if (guestAuthor && guestAuthor.name) {
      commentData.guestAuthor = {
        name: guestAuthor.name.trim(),
        email: guestAuthor.email ? guestAuthor.email.trim() : undefined
      };
    } else {
      return res.status(400).json({ message: 'Either user authentication or guest author information is required' });
    }
    
    // Create the new comment
    const newComment = new Comment(commentData);
    await newComment.save();
    
    // Populate author info if it exists
    if (req.user) {
      await newComment.populate('author', 'name email');
    }
    
    // If socket.io is available, emit event
    const io = req.app.get('io');
    if (io) {
      io.to(notebookId).emit('commentAdded', newComment.toJSON());
    }
    
    return res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment.toJSON()
    });
  } catch (error) {
    logger.error(`Error adding comment: ${error.message}`);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
}));

// Update a comment
router.put('/notebooks/:notebookId/comments/:commentId', optionalAuth, validateComment, catchAsync(async (req, res) => {
  try {
    const { notebookId, commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    // Check if comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if comment belongs to the specified notebook
    if (comment.notebookId.toString() !== notebookId) {
      return res.status(400).json({ message: 'Comment does not belong to this notebook' });
    }
    
    // Check if user is authorized to edit the comment
    if (req.user) {
      if (comment.author && comment.author.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You can only edit your own comments' });
      }
    } else if (comment.guestAuthor && (!req.body.guestAuthor || comment.guestAuthor.name !== req.body.guestAuthor.name)) {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }
    
    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    // Update the comment
    comment.content = content.trim();
    await comment.save();
    
    // Populate author info before sending response
    if (comment.author) {
      await comment.populate('author', 'name email');
    }
    
    // If socket.io is available, emit update event
    const io = req.app.get('io');
    if (io) {
      io.to(notebookId).emit('commentUpdated', comment.toJSON());
    }
    
    return res.status(200).json({
      message: 'Comment updated successfully',
      comment: comment.toJSON()
    });
  } catch (error) {
    logger.error(`Error updating comment: ${error.message}`);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
}));

// Delete a comment
router.delete('/notebooks/:notebookId/comments/:commentId', optionalAuth, catchAsync(async (req, res) => {
  try {
    const { notebookId, commentId } = req.params;
    const userId = req.user.id;
    
    // Check if comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if comment belongs to the specified notebook
    if (comment.notebookId.toString() !== notebookId) {
      return res.status(400).json({ message: 'Comment does not belong to this notebook' });
    }
    
    // Check if user is authorized to delete the comment
    const isCommentAuthor = comment.isOwnedBy(userId);
    const notebook = await Notebook.findById(notebookId);
    const isNotebookOwner = notebook && notebook.creatorID.toString() === userId;
    
    if (!isCommentAuthor && !isNotebookOwner) {
      return res.status(403).json({
        message: 'You can only delete your own comments or comments in your notebook'
      });
    }
    
    // If it's a parent comment, delete all replies as well
    if (!comment.parentId) {
      await Comment.deleteMany({ parentId: commentId });
    }
    
    // Delete the comment itself
    await comment.deleteOne();
    
    // If socket.io is available, emit delete event
    const io = req.app.get('io');
    if (io) {
      io.to(notebookId).emit('commentDeleted', {
        commentId,
        parentId: comment.parentId,
        deletedBy: {
          id: userId,
          isOwner: isNotebookOwner
        }
      });
    }
    
    return res.status(200).json({
      message: 'Comment deleted successfully',
      commentId,
      parentId: comment.parentId
    });
  } catch (error) {
    logger.error(`Error deleting comment: ${error.message}`);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
}));

module.exports = router;