const express = require('express');
const router = express.Router();
const CollaborationRequest = require('../models/collaborationRequestModel');
const Notebook = require('../models/notebookModel');
const { catchAsync } = require('../middlewares/errorHandler');
const { verifyToken } = require('../middlewares/verifyToken');
const logger = require('../utils/logger');

const getIO = (req) => req.app.get('io');

// Send a collaboration request
router.post('/send', verifyToken, catchAsync(async (req, res) => {
  const { notebookId, message, requestedAccess } = req.body;

  if (!notebookId) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Notebook ID is required'
    });
  }

  const notebook = await Notebook.findById(notebookId);
  if (!notebook) {
    return res.status(404).json({
      error: 'Not found',
      message: 'Notebook not found'
    });
  }

  // Cannot send request to yourself
  if (notebook.creatorID.toString() === req.user.id.toString()) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'You cannot send a collaboration request to your own notebook'
    });
  }

  // Check if user is already a collaborator
  const isAlreadyCollaborator = notebook.collaborators.some(
    c => (c.userId?.toString() || c.toString()) === req.user.id.toString()
  );
  if (isAlreadyCollaborator) {
    return res.status(400).json({
      error: 'Already a collaborator',
      message: 'You are already a collaborator on this notebook'
    });
  }

  // Check for existing pending request
  const existingRequest = await CollaborationRequest.findOne({
    notebookId,
    senderId: req.user.id,
    status: 'pending'
  });

  if (existingRequest) {
    return res.status(400).json({
      error: 'Request already sent',
      message: 'You already have a pending request for this notebook'
    });
  }

  const collaborationRequest = new CollaborationRequest({
    notebookId,
    senderId: req.user.id,
    receiverId: notebook.creatorID,
    message: message || '',
    requestedAccess: requestedAccess || 'write'
  });

  await collaborationRequest.save();

  // Populate sender and notebook info for the response
  await collaborationRequest.populate('senderId', 'name email');
  await collaborationRequest.populate('notebookId', 'title urlIdentifier');

  // Notify notebook owner via Socket.IO
  const io = getIO(req);
  if (io) {
    io.emit(`collabRequest:${notebook.creatorID}`, {
      type: 'new_request',
      request: {
        id: collaborationRequest._id,
        sender: {
          id: collaborationRequest.senderId._id,
          name: collaborationRequest.senderId.name,
          email: collaborationRequest.senderId.email
        },
        notebook: {
          id: collaborationRequest.notebookId._id,
          title: collaborationRequest.notebookId.title
        },
        message: collaborationRequest.message,
        requestedAccess: collaborationRequest.requestedAccess,
        createdAt: collaborationRequest.createdAt
      }
    });
  }

  logger.info(`Collaboration request sent by ${req.user.email} for notebook ${notebookId}`);

  res.status(201).json({
    message: 'Collaboration request sent successfully',
    request: {
      id: collaborationRequest._id,
      notebook: {
        id: collaborationRequest.notebookId._id,
        title: collaborationRequest.notebookId.title,
        urlIdentifier: collaborationRequest.notebookId.urlIdentifier
      },
      sender: {
        id: collaborationRequest.senderId._id,
        name: collaborationRequest.senderId.name,
        email: collaborationRequest.senderId.email
      },
      message: collaborationRequest.message,
      requestedAccess: collaborationRequest.requestedAccess,
      status: collaborationRequest.status,
      createdAt: collaborationRequest.createdAt
    }
  });
}));

// Get incoming collaboration requests (requests received by the current user as notebook owner)
router.get('/incoming', verifyToken, catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const status = req.query.status || 'pending';
  const skip = (page - 1) * limit;

  const query = { receiverId: req.user.id };
  if (status && status !== 'all') {
    query.status = status;
  }

  const total = await CollaborationRequest.countDocuments(query);

  const requests = await CollaborationRequest.find(query)
    .populate('senderId', 'name email profilePicture')
    .populate('notebookId', 'title urlIdentifier permissions')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    requests: requests.map(r => ({
      id: r._id,
      sender: {
        id: r.senderId._id,
        name: r.senderId.name,
        email: r.senderId.email,
        profilePicture: r.senderId.profilePicture
      },
      notebook: {
        id: r.notebookId._id,
        title: r.notebookId.title,
        urlIdentifier: r.notebookId.urlIdentifier,
        permissions: r.notebookId.permissions
      },
      message: r.message,
      requestedAccess: r.requestedAccess,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get outgoing collaboration requests (requests sent by the current user)
router.get('/outgoing', verifyToken, catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const status = req.query.status || 'all';
  const skip = (page - 1) * limit;

  const query = { senderId: req.user.id };
  if (status && status !== 'all') {
    query.status = status;
  }

  const total = await CollaborationRequest.countDocuments(query);

  const requests = await CollaborationRequest.find(query)
    .populate('receiverId', 'name email profilePicture')
    .populate('notebookId', 'title urlIdentifier permissions')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    requests: requests.map(r => ({
      id: r._id,
      receiver: {
        id: r.receiverId._id,
        name: r.receiverId.name,
        email: r.receiverId.email,
        profilePicture: r.receiverId.profilePicture
      },
      notebook: {
        id: r.notebookId._id,
        title: r.notebookId.title,
        urlIdentifier: r.notebookId.urlIdentifier,
        permissions: r.notebookId.permissions
      },
      message: r.message,
      requestedAccess: r.requestedAccess,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Accept a collaboration request
router.put('/:id/accept', verifyToken, catchAsync(async (req, res) => {
  const request = await CollaborationRequest.findById(req.params.id);

  if (!request) {
    return res.status(404).json({
      error: 'Not found',
      message: 'Collaboration request not found'
    });
  }

  // Only the receiver (notebook owner) can accept
  if (request.receiverId.toString() !== req.user.id.toString()) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Only the notebook owner can accept collaboration requests'
    });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({
      error: 'Invalid action',
      message: `This request has already been ${request.status}`
    });
  }

  // Update request status
  request.status = 'accepted';
  request.updatedAt = new Date();
  await request.save();

  // Add sender as collaborator to the notebook
  const notebook = await Notebook.findById(request.notebookId);
  if (notebook) {
    // Check if already a collaborator (edge case)
    const alreadyCollaborator = notebook.collaborators.some(
      c => (c.userId?.toString() || c.toString()) === request.senderId.toString()
    );

    if (!alreadyCollaborator) {
      notebook.collaborators.push({
        userId: request.senderId,
        access: request.requestedAccess
      });
      await notebook.save();
    }

    // Notify the sender via Socket.IO
    const io = getIO(req);
    if (io) {
      io.emit(`collabRequest:${request.senderId}`, {
        type: 'accepted',
        request: {
          id: request._id,
          notebookId: request.notebookId,
          notebookTitle: notebook.title
        }
      });

      // Also notify the notebook room
      io.to(request.notebookId.toString()).emit('collaboratorUpdated', {
        notebookId: request.notebookId,
        collaborator: {
          id: request.senderId,
          access: request.requestedAccess
        }
      });
    }

    await request.populate('senderId', 'name email');

    logger.info(`Collaboration request ${request._id} accepted by ${req.user.email}`);

    res.json({
      message: 'Collaboration request accepted',
      request: {
        id: request._id,
        sender: {
          id: request.senderId._id,
          name: request.senderId.name,
          email: request.senderId.email
        },
        notebook: {
          id: notebook._id,
          title: notebook.title
        },
        requestedAccess: request.requestedAccess,
        status: request.status
      }
    });
  } else {
    res.status(404).json({
      error: 'Not found',
      message: 'Associated notebook not found'
    });
  }
}));

// Decline a collaboration request
router.put('/:id/decline', verifyToken, catchAsync(async (req, res) => {
  const request = await CollaborationRequest.findById(req.params.id);

  if (!request) {
    return res.status(404).json({
      error: 'Not found',
      message: 'Collaboration request not found'
    });
  }

  // Only the receiver (notebook owner) can decline
  if (request.receiverId.toString() !== req.user.id.toString()) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Only the notebook owner can decline collaboration requests'
    });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({
      error: 'Invalid action',
      message: `This request has already been ${request.status}`
    });
  }

  request.status = 'declined';
  request.updatedAt = new Date();
  await request.save();

  // Notify the sender via Socket.IO
  const io = getIO(req);
  if (io) {
    await request.populate('notebookId', 'title');
    io.emit(`collabRequest:${request.senderId}`, {
      type: 'declined',
      request: {
        id: request._id,
        notebookId: request.notebookId._id,
        notebookTitle: request.notebookId.title
      }
    });
  }

  logger.info(`Collaboration request ${request._id} declined by ${req.user.email}`);

  res.json({
    message: 'Collaboration request declined',
    request: {
      id: request._id,
      status: request.status
    }
  });
}));

// Cancel an outgoing collaboration request
router.delete('/:id/cancel', verifyToken, catchAsync(async (req, res) => {
  const request = await CollaborationRequest.findById(req.params.id);

  if (!request) {
    return res.status(404).json({
      error: 'Not found',
      message: 'Collaboration request not found'
    });
  }

  // Only the sender can cancel their own request
  if (request.senderId.toString() !== req.user.id.toString()) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only cancel your own requests'
    });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({
      error: 'Invalid action',
      message: `Cannot cancel a request that has already been ${request.status}`
    });
  }

  await CollaborationRequest.findByIdAndDelete(req.params.id);

  logger.info(`Collaboration request ${req.params.id} cancelled by ${req.user.email}`);

  res.json({
    message: 'Collaboration request cancelled'
  });
}));

// Get request counts (for badge/notification purposes)
router.get('/counts', verifyToken, catchAsync(async (req, res) => {
  const incomingPending = await CollaborationRequest.countDocuments({
    receiverId: req.user.id,
    status: 'pending'
  });

  const outgoingPending = await CollaborationRequest.countDocuments({
    senderId: req.user.id,
    status: 'pending'
  });

  const incomingAll = await CollaborationRequest.countDocuments({
    receiverId: req.user.id
  });

  const outgoingAll = await CollaborationRequest.countDocuments({
    senderId: req.user.id
  });

  res.json({
    incoming: {
      pending: incomingPending,
      total: incomingAll
    },
    outgoing: {
      pending: outgoingPending,
      total: outgoingAll
    }
  });
}));

module.exports = router;
