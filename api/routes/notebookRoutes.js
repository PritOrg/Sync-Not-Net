const express = require('express');
const router = express.Router();
const Notebook = require('../models/notebookModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { catchAsync } = require('../middlewares/errorHandler');
const {
  validateNotebookCreation,
  validateNotebookUpdate,
  validateNotebookAccess,
  validateUrlUpdate
} = require('../middlewares/validation');
const { optionalAuth, verifyToken } = require('../middlewares/verifyToken');
const logger = require('../utils/logger');
const { 
  convertToXMLFormat, 
  extractContentFromXML, 
  updateXMLContent,
  generateEmptyXMLContent,
  validateXMLStructure
} = require('../utils/notebookFormatUtils');

// Helper function to get io instance from app
const getIO = (req) => {
  return req.app.get('io');
};

// Get user's own notebooks with pagination and search
router.get('/my-notebooks', verifyToken, catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    search = '',
    sortBy = 'updatedAt',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build search query for user's notebooks only
  const searchQuery = {
    creatorID: req.user.id
  };

  if (search.trim()) {
    searchQuery.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Build sort object
  const sortObj = {};
  sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

  try {
    // Get total count for pagination
    const total = await Notebook.countDocuments(searchQuery);

    // Get notebooks with pagination
    const notebooks = await Notebook.find(searchQuery)
      .populate('creatorID', 'name email')
      .populate('collaborators', 'name email')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .exec();

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      notebooks,
      pagination: {
        page: pageNum,
        pages: totalPages,
        total,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    logger.error('Error fetching user notebooks:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch notebooks'
    });
  }
}));

// PUBLIC ROUTES (no authentication required) - removed, integrated into main routes
// Get public notebook access (for sharing without login)
router.get('/:urlIdentifier', optionalAuth, catchAsync(async (req, res) => {
  const notebook = await Notebook.findOne({ urlIdentifier: req.params.urlIdentifier })
    .populate('creatorID', 'name email')
    .populate('collaborators', 'name email')
    .exec();

  if (!notebook) {
    return res.status(404).json({
      error: 'Notebook not found',
      message: 'The requested notebook does not exist or has been deleted'
    });
  }

  const isAuthenticated = !!req.user;
  const isCreator = isAuthenticated && notebook.creatorID._id.toString() === req.user.id.toString();
  const isCollaborator = isAuthenticated && notebook.collaborators.some(collab => collab._id.toString() === req.user.id.toString());
  const hasPassword = notebook.password !== null && notebook.password !== undefined;

  console.log('Access attempt:', {
    urlIdentifier: req.params.urlIdentifier,
    permissions: notebook.permissions,
    hasPassword,
    isAuthenticated,
    isCreator,
    isCollaborator
  });

  // Handle different permission levels
  if (notebook.permissions.toString() === 'private') {
    // PRIVATE: Only owner can access
    if (!isCreator) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'This notebook is private and only accessible by the owner'
      });
    }
    
    // Owner accessing private notebook
    if (hasPassword) {
      // Private + password: require password even for owner
      return res.json({
        requiresPassword: true,
        accessLevel: 'edit',
        userRole: 'owner',
        notebook: {
          id: notebook._id,
          title: notebook.title,
          urlIdentifier: notebook.urlIdentifier,
          creator: {
            name: notebook.creatorID.name
          }
        },
        message: 'Password required for access'
      });
    } else {
      // Private + no password: direct access for owner
      return res.json({
        _id: notebook._id,
        title: notebook.title,
        content: extractContentFromXML(notebook.content), // Send plain content to frontend
        urlIdentifier: notebook.urlIdentifier,
        permissions: notebook.permissions,
        editorMode: notebook.editorMode,
        language: notebook.language,
        autoSave: notebook.autoSave,
        tags: notebook.tags,
        version: notebook.version,
        creator: {
          id: notebook.creatorID._id,
          name: notebook.creatorID.name,
          email: notebook.creatorID.email
        },
        collaborators: notebook.collaborators.map(collab => ({
          id: collab._id,
          name: collab.name,
          email: collab.email
        })),
        accessLevel: 'edit',
        userRole: 'owner',
        hasAccess: true,
        requiresPassword: false,
        message: 'Notebook accessed successfully'
      });
    }
  }

  if (notebook.permissions.toString() === 'collaborators') {
    // COLLABORATORS: Only owner and collaborators can access
    if (!isCreator && !isCollaborator) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'This notebook is only accessible by collaborators'
      });
    }

    const userRole = isCreator ? 'owner' : 'collaborator';
    
    if (hasPassword) {
      // Collaborators + password: require password
      return res.json({
        requiresPassword: true,
        accessLevel: 'edit',
        userRole,
        notebook: {
          id: notebook._id,
          title: notebook.title,
          urlIdentifier: notebook.urlIdentifier,
          creator: {
            name: notebook.creatorID.name
          }
        },
        message: 'Password required for access'
      });
    } else {
      // Collaborators + no password: direct access
      return res.json({
        _id: notebook._id,
        title: notebook.title,
        content: extractContentFromXML(notebook.content), // Send plain content to frontend
        urlIdentifier: notebook.urlIdentifier,
        permissions: notebook.permissions,
        editorMode: notebook.editorMode,
        language: notebook.language,
        autoSave: notebook.autoSave,
        tags: notebook.tags,
        version: notebook.version,
        creator: {
          id: notebook.creatorID._id,
          name: notebook.creatorID.name,
          email: notebook.creatorID.email
        },
        collaborators: notebook.collaborators.map(collab => ({
          id: collab._id,
          name: collab.name,
          email: collab.email
        })),
        accessLevel: 'edit',
        userRole,
        hasAccess: true,
        requiresPassword: false,
        message: 'Notebook accessed successfully'
      });
    }
  }

  if (notebook.permissions.toString() === 'everyone') {
    // EVERYONE: Public access for all users
    
    if (hasPassword) {
      // Everyone + password: require password and guest name for unauthenticated users
      if (isCreator || isCollaborator) {
        // Owner/collaborator with password protection
        return res.json({
          requiresPassword: true,
          accessLevel: 'edit',
          userRole: isCreator ? 'owner' : 'collaborator',
          notebook: {
            id: notebook._id,
            title: notebook.title,
            urlIdentifier: notebook.urlIdentifier,
            creator: {
              name: notebook.creatorID.name
            }
          },
          message: 'Password required for full access'
        });
      } else {
        // Public user with password protection - require password and guest name for edit
        if (!isAuthenticated) {
          return res.json({
            requiresPassword: true,
            requiresGuestName: true,
            accessLevel: 'read',
            userRole: 'viewer',
            notebook: {
              id: notebook._id,
              title: notebook.title,
              urlIdentifier: notebook.urlIdentifier,
              creator: {
                name: notebook.creatorID.name
              }
            },
            message: 'Password and guest name required for edit access'
          });
        } else {
          return res.json({
            requiresPassword: true,
            accessLevel: 'read',
            userRole: 'public',
            notebook: {
              id: notebook._id,
              title: notebook.title,
              urlIdentifier: notebook.urlIdentifier,
              creator: {
                name: notebook.creatorID.name
              }
            },
            message: 'Password required for edit access'
          });
        }
      }
    } else {
      // Everyone + no password: full public access
      if (!isAuthenticated) {
        // Unauthenticated user - require guest name for collaboration
        return res.json({
          requiresGuestName: true,
          accessLevel: 'edit',
          userRole: 'guest',
          notebook: {
            id: notebook._id,
            title: notebook.title,
            urlIdentifier: notebook.urlIdentifier,
            creator: {
              name: notebook.creatorID.name
            }
          },
          message: 'Please provide a temporary name to collaborate'
        });
      } else {
        // Authenticated user - direct access
        const userRole = isCreator ? 'owner' : (isCollaborator ? 'collaborator' : 'public');
        return res.json({
          _id: notebook._id,
          title: notebook.title,
          content: extractContentFromXML(notebook.content), // Send plain content to frontend
          urlIdentifier: notebook.urlIdentifier,
          permissions: notebook.permissions,
          editorMode: notebook.editorMode,
          language: notebook.language,
          autoSave: notebook.autoSave,
          tags: notebook.tags,
          version: notebook.version,
          creator: {
            id: notebook.creatorID._id,
            name: notebook.creatorID.name,
            email: notebook.creatorID.email
          },
          collaborators: notebook.collaborators.map(collab => ({
            id: collab._id,
            name: collab.name,
            email: collab.email
          })),
          accessLevel: 'edit',
          userRole,
          hasAccess: true,
          requiresPassword: false,
          message: 'Notebook accessed successfully'
        });
      }
    }
  }

  // Fallback - should not reach here
  return res.status(500).json({
    error: 'Server error',
    message: 'Unable to determine access permissions'
  });
}));

// Verify password for notebook access (supports both public and authenticated users)
router.post('/:urlIdentifier/verify-password', optionalAuth, catchAsync(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      error: 'Password required',
      message: 'Please provide a password'
    });
  }

  const notebook = await Notebook.findOne({ urlIdentifier: req.params.urlIdentifier })
    .populate('creatorID', 'name email')
    .populate('collaborators', 'name email')
    .exec();

  if (!notebook) {
    return res.status(404).json({
      error: 'Notebook not found',
      message: 'The requested notebook does not exist or has been deleted'
    });
  }

  if (!notebook.password) {
    return res.status(400).json({
      error: 'No password set',
      message: 'This notebook does not require a password'
    });
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, notebook.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      error: 'Invalid password',
      message: 'The password you entered is incorrect'
    });
  }

  const isAuthenticated = !!req.user;
  const isCreator = isAuthenticated && notebook.creatorID._id.toString() === req.user.id.toString();
  const isCollaborator = isAuthenticated && notebook.collaborators.some(collab => collab._id.toString() === req.user.id.toString());

  console.log('Password verification successful:', {
    urlIdentifier: req.params.urlIdentifier,
    permissions: notebook.permissions,
    isAuthenticated,
    isCreator,
    isCollaborator
  });

  // Determine access level and user role based on permissions
  let accessLevel = 'edit'; // Default for password-protected notebooks
  let userRole = 'viewer';

  if (notebook.permissions.toString() === 'private') {
    // Private notebook - only owner should have access
    if (isCreator) {
      accessLevel = 'edit';
      userRole = 'owner';
    } else {
      return res.status(403).json({
        error: 'Access denied',
        message: 'This is a private notebook'
      });
    }
  } else if (notebook.permissions.toString() === 'collaborators') {
    // Collaborators only
    if (isCreator) {
      accessLevel = 'edit';
      userRole = 'owner';
    } else if (isCollaborator) {
      accessLevel = 'edit';
      userRole = 'collaborator';
    } else {
      return res.status(403).json({
        error: 'Access denied',
        message: 'This notebook is only accessible by collaborators'
      });
    }
  } else if (notebook.permissions.toString() === 'everyone') {
    // Public notebook with password
    if (isCreator) {
      accessLevel = 'edit';
      userRole = 'owner';
    } else if (isCollaborator) {
      accessLevel = 'edit';
      userRole = 'collaborator';
    } else {
      accessLevel = 'edit';
      userRole = isAuthenticated ? 'public' : 'guest';
    }
  }

  // Password is valid - return notebook content
  res.json({
    _id: notebook._id,
    title: notebook.title,
    content: extractContentFromXML(notebook.content), // Send plain content to frontend
    urlIdentifier: notebook.urlIdentifier,
    permissions: notebook.permissions,
    editorMode: notebook.editorMode,
    language: notebook.language,
    autoSave: notebook.autoSave,
    tags: notebook.tags,
    version: notebook.version,
    creator: {
      id: notebook.creatorID._id,
      name: notebook.creatorID.name,
      email: notebook.creatorID.email
    },
    collaborators: notebook.collaborators.map(collab => ({
      id: collab._id,
      name: collab.name,
      email: collab.email
    })),
    accessLevel,
    userRole,
    hasAccess: true,
    message: 'Password verified successfully'
  });
}));

// AUTHENTICATED ROUTES (require login)

// Create new notebook with enhanced validation and security
router.post('/', verifyToken, validateNotebookCreation, catchAsync(async (req, res) => {
  const { title, content, permissions, collaborators, password, tags, editorMode, autoSave, language } = req.body;

  // Ensure collaborators is an array of user IDs
  let collaboratorIds = [];
  if (Array.isArray(collaborators)) {
    collaboratorIds = collaborators.map(c => typeof c === 'string' ? c : c._id || c.id).filter(Boolean);
  }

  // Generate unique URL identifier
  let urlIdentifier;
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 5) {
    urlIdentifier = crypto.randomBytes(8).toString('hex');
    const existingNotebook = await Notebook.findOne({ urlIdentifier });
    if (!existingNotebook) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to generate unique identifier'
    });
  }

  // Hash password if provided
  const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

  // Ensure content is in XML format
  const xmlContent = content ? 
    convertToXMLFormat(content, language || 'javascript', editorMode || 'quill') : 
    generateEmptyXMLContent(language || 'javascript');

  // Create new notebook
  const newNotebook = new Notebook({
    creatorID: req.user.id,
    title: title || 'Untitled Notebook',
    content: xmlContent,
    permissions: permissions || 'everyone',
    collaborators: collaboratorIds,
    password: hashedPassword,
    tags: tags || [],
    editorMode: editorMode || 'quill',
    language: language || 'javascript',
    autoSave: autoSave !== undefined ? autoSave : true,
    urlIdentifier,
  });

  await newNotebook.save();

  // Populate collaborators for response
  await newNotebook.populate('collaborators', 'name email');

  logger.info(`New notebook created: ${title} by user ${req.user.email}`);

  res.status(201).json({
    notebook: {
      _id: newNotebook._id,
      title: newNotebook.title,
      content: extractContentFromXML(newNotebook.content), // Send plain content to frontend
      permissions: newNotebook.permissions,
      collaborators: newNotebook.collaborators,
      tags: newNotebook.tags,
      editorMode: newNotebook.editorMode,
      autoSave: newNotebook.autoSave,
      urlIdentifier: newNotebook.urlIdentifier,
      createdAt: newNotebook.createdAt,
      version: newNotebook.version
    },
    message: 'Notebook created successfully'
  });
}));


// Get user's notebooks with pagination and filtering
router.get('/', verifyToken, catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';
  const sortBy = req.query.sortBy || 'updatedAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  // Build query to find notebooks user has access to
  const query = {
    $or: [
      { creatorID: req.user.id },
      { collaborators: req.user.id },
      { permissions: 'everyone' }
    ]
  };

  // Add search filter if provided
  if (search) {
    query.$and = [
      query.$or ? { $or: query.$or } : {},
      {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      }
    ];
    delete query.$or;
  }

  // Execute query with pagination
  const notebooks = await Notebook.find(query)
    .populate('creatorID', 'name email')
    .populate('collaborators', 'name email')
    .select('-password') // Never return password hashes
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);

  const total = await Notebook.countDocuments(query);

  res.json({
    notebooks,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    filters: {
      search,
      sortBy,
      sortOrder: sortOrder === 1 ? 'asc' : 'desc'
    }
  });
}));

// Get notebooks shared with the user (collaborations)
router.get('/shared', verifyToken, catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    search = '',
    sortBy = 'updatedAt',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build search query for notebooks where user is a collaborator
  const searchQuery = {
    collaborators: req.user.id,
    creatorID: { $ne: req.user.id } // Exclude own notebooks
  };

  if (search.trim()) {
    searchQuery.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Build sort object
  const sortObj = {};
  sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

  try {
    // Get total count for pagination
    const total = await Notebook.countDocuments(searchQuery);

    // Get notebooks with pagination
    const notebooks = await Notebook.find(searchQuery)
      .populate('creatorID', 'name email')
      .populate('collaborators', 'name email')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .exec();

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      notebooks,
      pagination: {
        page: pageNum,
        pages: totalPages,
        total,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    logger.error('Error fetching shared notebooks:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch shared notebooks'
    });
  }
}));

// Get notebook access with enhanced security (no password exposure)
router.get('/:urlIdentifier/access', verifyToken, validateNotebookAccess, catchAsync(async (req, res) => {
  const notebook = await Notebook.findOne({ urlIdentifier: req.params.urlIdentifier })
    .populate('creatorID', 'name email')
    .populate('collaborators', 'name email')
    .exec();

  if (!notebook) {
    return res.status(404).json({
      error: 'Notebook not found',
      message: 'The requested notebook does not exist or has been deleted'
    });
  }

  const isAuthenticated = !!req.user;
  const isCreator = isAuthenticated && notebook.creatorID._id.toString() === req.user.id.toString();
  const isCollaborator = isAuthenticated && notebook.collaborators.some(collab => collab._id.toString() === req.user.id.toString());
  const hasPassword = notebook.password !== null && notebook.password !== undefined;

  console.log('Authenticated access attempt:', {
    urlIdentifier: req.params.urlIdentifier,
    permissions: notebook.permissions,
    hasPassword,
    isCreator,
    isCollaborator,
    userId: req.user.id
  });

  // Handle different permission levels
  if (notebook.permissions.toString() === 'private') {
    // PRIVATE: Only owner can access
    if (!isCreator) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'This notebook is private and only accessible by the owner'
      });
    }
    
    // Owner accessing private notebook
    if (hasPassword) {
      // Private + password: require password even for owner
      return res.json({
        _id: notebook._id,
        title: notebook.title,
        urlIdentifier: notebook.urlIdentifier,
        permissions: notebook.permissions,
        editorMode: notebook.editorMode,
        language: notebook.language,
        autoSave: notebook.autoSave,
        tags: notebook.tags,
        createdAt: notebook.createdAt,
        updatedAt: notebook.updatedAt,
        version: notebook.version,
        creator: {
          id: notebook.creatorID._id,
          name: notebook.creatorID.name,
          email: notebook.creatorID.email
        },
        collaborators: notebook.collaborators.map(collab => ({
          id: collab._id,
          name: collab.name,
          email: collab.email
        })),
        requiresPassword: true,
        hasAccess: false,
        accessLevel: 'edit',
        userRole: 'owner',
        message: 'Password required for access'
      });
    } else {
      // Private + no password: direct access for owner
      return res.json({
        _id: notebook._id,
        title: notebook.title,
        urlIdentifier: notebook.urlIdentifier,
        permissions: notebook.permissions,
        editorMode: notebook.editorMode,
        language: notebook.language,
        autoSave: notebook.autoSave,
        tags: notebook.tags,
        createdAt: notebook.createdAt,
        updatedAt: notebook.updatedAt,
        version: notebook.version,
        creator: {
          id: notebook.creatorID._id,
          name: notebook.creatorID.name,
          email: notebook.creatorID.email
        },
        collaborators: notebook.collaborators.map(collab => ({
          id: collab._id,
          name: collab.name,
          email: collab.email
        })),
        content: extractContentFromXML(notebook.content), // Send plain content to frontend
        requiresPassword: false,
        hasAccess: true,
        accessLevel: 'edit',
        userRole: 'owner'
      });
    }
  }

  if (notebook.permissions.toString() === 'collaborators') {
    // COLLABORATORS: Only owner and collaborators can access
    if (!isCreator && !isCollaborator) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'This notebook is only accessible by collaborators'
      });
    }

    const userRole = isCreator ? 'owner' : 'collaborator';
    
    if (hasPassword) {
      // Collaborators + password: require password
      return res.json({
        _id: notebook._id,
        title: notebook.title,
        urlIdentifier: notebook.urlIdentifier,
        permissions: notebook.permissions,
        editorMode: notebook.editorMode,
        language: notebook.language,
        autoSave: notebook.autoSave,
        tags: notebook.tags,
        createdAt: notebook.createdAt,
        updatedAt: notebook.updatedAt,
        version: notebook.version,
        creator: {
          id: notebook.creatorID._id,
          name: notebook.creatorID.name,
          email: notebook.creatorID.email
        },
        collaborators: notebook.collaborators.map(collab => ({
          id: collab._id,
          name: collab.name,
          email: collab.email
        })),
        requiresPassword: true,
        hasAccess: false,
        accessLevel: 'edit',
        userRole,
        message: 'Password required for access'
      });
    } else {
      // Collaborators + no password: direct access
      return res.json({
        _id: notebook._id,
        title: notebook.title,
        urlIdentifier: notebook.urlIdentifier,
        permissions: notebook.permissions,
        editorMode: notebook.editorMode,
        language: notebook.language,
        autoSave: notebook.autoSave,
        tags: notebook.tags,
        createdAt: notebook.createdAt,
        updatedAt: notebook.updatedAt,
        version: notebook.version,
        creator: {
          id: notebook.creatorID._id,
          name: notebook.creatorID.name,
          email: notebook.creatorID.email
        },
        collaborators: notebook.collaborators.map(collab => ({
          id: collab._id,
          name: collab.name,
          email: collab.email
        })),
        content: extractContentFromXML(notebook.content), // Send plain content to frontend
        requiresPassword: false,
        hasAccess: true,
        accessLevel: 'edit',
        userRole
      });
    }
  }

  if (notebook.permissions.toString() === 'everyone') {
    // EVERYONE: Public access for all users
    const userRole = isCreator ? 'owner' : (isCollaborator ? 'collaborator' : 'public');
    
    if (hasPassword) {
      // Everyone + password: require password for full access
      return res.json({
        _id: notebook._id,
        title: notebook.title,
        urlIdentifier: notebook.urlIdentifier,
        permissions: notebook.permissions,
        editorMode: notebook.editorMode,
        language: notebook.language,
        autoSave: notebook.autoSave,
        tags: notebook.tags,
        createdAt: notebook.createdAt,
        updatedAt: notebook.updatedAt,
        version: notebook.version,
        creator: {
          id: notebook.creatorID._id,
          name: notebook.creatorID.name,
          email: notebook.creatorID.email
        },
        collaborators: notebook.collaborators.map(collab => ({
          id: collab._id,
          name: collab.name,
          email: collab.email
        })),
        requiresPassword: true,
        hasAccess: false,
        accessLevel: 'edit',
        userRole,
        message: 'Password required for full access'
      });
    } else {
      // Everyone + no password: direct access
      return res.json({
        _id: notebook._id,
        title: notebook.title,
        urlIdentifier: notebook.urlIdentifier,
        permissions: notebook.permissions,
        editorMode: notebook.editorMode,
        language: notebook.language,
        autoSave: notebook.autoSave,
        tags: notebook.tags,
        createdAt: notebook.createdAt,
        updatedAt: notebook.updatedAt,
        version: notebook.version,
        creator: {
          id: notebook.creatorID._id,
          name: notebook.creatorID.name,
          email: notebook.creatorID.email
        },
        collaborators: notebook.collaborators.map(collab => ({
          id: collab._id,
          name: collab.name,
          email: collab.email
        })),
        content: extractContentFromXML(notebook.content), // Send plain content to frontend
        requiresPassword: false,
        hasAccess: true,
        accessLevel: 'edit',
        userRole
      });
    }
  }

  // Fallback - should not reach here
  return res.status(500).json({
    error: 'Server error',
    message: 'Unable to determine access permissions'
  });
}));

// Verify notebook password
// router.post('/:urlIdentifier/verify-password', validateNotebookAccess, catchAsync(async (req, res) => {
//   const { password, guestId, guestName } = req.body;

//   if (!password) {
//     return res.status(400).json({
//       error: 'Password required',
//       message: 'Please provide a password'
//     });
//   }

//   const notebook = await Notebook.findOne({ urlIdentifier: req.params.urlIdentifier });

//   if (!notebook) {
//     return res.status(404).json({
//       error: 'Notebook not found',
//       message: 'The requested notebook does not exist'
//     });
//   }

//   if (!notebook.password) {
//     return res.status(400).json({
//       error: 'No password required',
//       message: 'This notebook is not password protected'
//     });
//   }

//   const isPasswordValid = await bcrypt.compare(password, notebook.password);

//   if (!isPasswordValid) {
//     logger.warn(`Invalid password attempt for notebook ${notebook.urlIdentifier}`);
//     return res.status(401).json({
//       error: 'Invalid password',
//       message: 'The password you entered is incorrect'
//     });
//   }

//   // Password is valid - return notebook content
//   await notebook.populate('creatorID', 'name email');
//   await notebook.populate('collaborators', 'name email');

//   // If guest credentials are present, return guest info and set accessLevel/userRole accordingly
//   if (guestId && guestName) {
//     return res.json({
//       _id: notebook._id,
//       title: notebook.title,
//       content: notebook.content,
//       urlIdentifier: notebook.urlIdentifier,
//       permissions: notebook.permissions,
//       editorMode: notebook.editorMode,
//       autoSave: notebook.autoSave,
//       tags: notebook.tags,
//       version: notebook.version,
//       creator: {
//         id: notebook.creatorID._id,
//         name: notebook.creatorID.name,
//         email: notebook.creatorID.email
//       },
//       collaborators: notebook.collaborators.map(collab => ({
//         id: collab._id,
//         name: collab.name,
//         email: collab.email
//       })),
//       hasAccess: true,
//       accessLevel: 'edit',
//       userRole: 'guest',
//       guestUser: {
//         id: guestId,
//         name: guestName,
//         role: 'guest'
//       },
//       message: 'Password verified successfully (guest)'
//     });
//   }

//   // Otherwise, treat as authenticated user
//   res.json({
//     _id: notebook._id,
//     title: notebook.title,
//     content: notebook.content,
//     urlIdentifier: notebook.urlIdentifier,
//     permissions: notebook.permissions,
//     editorMode: notebook.editorMode,
//     autoSave: notebook.autoSave,
//     tags: notebook.tags,
//     version: notebook.version,
//     creator: {
//       id: notebook.creatorID._id,
//       name: notebook.creatorID.name,
//       email: notebook.creatorID.email
//     },
//     collaborators: notebook.collaborators.map(collab => ({
//       id: collab._id,
//       name: collab.name,
//       email: collab.email
//     })),
//     hasAccess: true,
//     accessLevel: 'edit',
//     userRole: 'owner', // fallback, frontend should set this based on auth
//     message: 'Password verified successfully'
//   });
// }));
// Register guest user for public collaboration
router.post('/:urlIdentifier/register-guest', catchAsync(async (req, res) => {
  const { guestName } = req.body;

  if (!guestName || guestName.trim().length < 1) {
    return res.status(400).json({
      error: 'Guest name required',
      message: 'Please provide a name for collaboration'
    });
  }

  const notebook = await Notebook.findOne({ urlIdentifier: req.params.urlIdentifier })
    .populate('creatorID', 'name email')
    .populate('collaborators', 'name email')
    .exec();

  if (!notebook) {
    return res.status(404).json({
      error: 'Notebook not found',
      message: 'The requested notebook does not exist or has been deleted'
    });
  }

  // Check if notebook allows public access
  if (notebook.permissions !== 'everyone') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'This notebook is not publicly accessible'
    });
  }

  // Generate unique guest ID
  const guestId = `guest_${crypto.randomBytes(8).toString('hex')}`;
  const sanitizedGuestName = guestName.trim().substring(0, 50); // Limit name length

  // If notebook is password protected, do not return content yet
  if (notebook.password) {
    return res.json({
      requiresPassword: true,
      guestUser: {
        id: guestId,
        name: sanitizedGuestName,
        role: 'guest'
      },
      accessLevel: 'read',
      userRole: 'guest',
      notebook: {
        id: notebook._id,
        title: notebook.title,
        urlIdentifier: notebook.urlIdentifier,
        creator: {
          name: notebook.creatorID.name
        }
      },
      message: 'Password required for guest access'
    });
  }

  // Otherwise, grant access
  res.json({
    _id: notebook._id,
    title: notebook.title,
    content: extractContentFromXML(notebook.content), // Send plain content to frontend
    urlIdentifier: notebook.urlIdentifier,
    permissions: notebook.permissions,
    editorMode: notebook.editorMode,
    language: notebook.language,
    autoSave: notebook.autoSave,
    tags: notebook.tags,
    version: notebook.version,
    creator: {
      id: notebook.creatorID._id,
      name: notebook.creatorID.name,
      email: notebook.creatorID.email
    },
    collaborators: notebook.collaborators.map(collab => ({
      id: collab._id,
      name: collab.name,
      email: collab.email
    })),
    accessLevel: 'edit',
    userRole: 'public',
    hasAccess: true,
    requiresPassword: false,
    guestUser: {
      id: guestId,
      name: sanitizedGuestName,
      role: 'guest'
    },
    message: 'Guest access granted successfully'
  });
}));
// Update notebook (restricted by permissions)
router.put('/:id/url', verifyToken, validateUrlUpdate, catchAsync(async (req, res) => {
  const { urlIdentifier } = req.body;

  try {
    const notebook = await Notebook.findById(req.params.id);

    if (!notebook) {
      return res.status(404).json({
        error: 'Notebook not found',
        message: 'The notebook you are trying to update does not exist'
      });
    }

    if (notebook.creatorID.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only the creator can edit the URL'
      });
    }

    // Check if the new identifier is unique (case-insensitive)
    const existingNotebook = await Notebook.findOne({
      urlIdentifier: { $regex: new RegExp(`^${urlIdentifier}$`, 'i') },
      _id: { $ne: notebook._id }
    });

    if (existingNotebook) {
      return res.status(400).json({
        error: 'URL already taken',
        message: 'This URL identifier is already in use. Please choose a different one.'
      });
    }

    const oldUrlIdentifier = notebook.urlIdentifier;
    notebook.urlIdentifier = urlIdentifier;
    await notebook.save();

    logger.info(`URL identifier updated for notebook ${notebook._id}: ${oldUrlIdentifier} -> ${urlIdentifier}`);

    res.json({
      message: 'URL updated successfully',
      urlIdentifier: notebook.urlIdentifier
    });
  } catch (error) {
    logger.error('Error updating notebook URL:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update URL. Please try again.'
    });
  }
}));

router.put('/:id', optionalAuth, async (req, res) => {
  const {
    title,
    content,
    permissions,
    collaborators,
    editorMode,
    autoSave,
    password,
    tags,
    urlIdentifier,
    language
  } = req.body;

  try {
    const notebook = await Notebook.findById(req.params.id);
    if (!notebook) {
      return res.status(404).json({
        error: 'Notebook not found',
        message: 'The requested notebook does not exist'
      });
    }

    // Determine user permissions
    const isAuthenticated = !!req.user;
    const isCreator = isAuthenticated && notebook.creatorID.toString() === req.user.id.toString();
    const isCollaborator = isAuthenticated && notebook.collaborators.some(collab => collab.toString() === req.user.id.toString());
    const isPublicNotebook = notebook.permissions.toString() === 'everyone' ;

    // Check if user has edit permissions
    const hasEditAccess = isCreator || isCollaborator || isPublicNotebook ||notebook.permissions.toString() === 'everyone';

    if (!hasEditAccess) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to edit this notebook'
      });
    }

    // Only owner can change settings fields (permissions, collaborators, password, urlIdentifier)
    const allowedFields = ['title', 'content', 'editorMode', 'autoSave', 'tags', 'language'];
    if (isCreator) {
      allowedFields.push('permissions', 'collaborators', 'password', 'urlIdentifier');
    }
    const restrictedFields = ['permissions', 'collaborators', 'password', 'urlIdentifier', 'creatorID', 'version', 'createdAt', 'updatedAt'];

    if (!isAuthenticated || (!isCreator && isPublicNotebook)) {
      // Public or non-creator user - restrict fields
      const sentRestricted = Object.keys(req.body).filter(f => restrictedFields.includes(f));
      if (sentRestricted.length > 0) {
        logger.warn(`Public save attempt tried to change restricted fields: ${sentRestricted.join(', ')} for notebook ${req.params.id}`);
      }

      logger.info(`Public save request for notebook ${req.params.id}: ${JSON.stringify(req.body)}`);

      // Only update allowed fields for public users
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          if (field === 'content') {
            // Ensure content is stored in XML format for public users too
            notebook[field] = updateXMLContent(notebook.content, req.body[field], notebook.language, notebook.editorMode);
          } else {
            notebook[field] = req.body[field];
          }
        }
      });
    } else {
      // Authenticated user with proper permissions

      // Only creator can modify notebook settings (permissions, collaborators, etc.)
      if (!isCreator && (
        permissions !== undefined ||
        collaborators !== undefined ||
        password !== undefined ||
        urlIdentifier !== undefined
      )) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only the creator can modify notebook settings'
        });
      }

      // Update fields only if provided in request body
      if (title !== undefined) notebook.title = title;
      if (content !== undefined) {
        // Ensure content is stored in XML format
        notebook.content = updateXMLContent(notebook.content, content, notebook.language, notebook.editorMode);
      }
      if (editorMode !== undefined) notebook.editorMode = editorMode;
      // Ensure language is always defined
      if (typeof language === 'undefined' || language === null) {
        notebook.language = notebook.language || 'javascript';
      } else {
        notebook.language = language;
      }
      if (autoSave !== undefined) notebook.autoSave = autoSave;
      if (tags !== undefined) notebook.tags = tags;

      // Creator-only fields
      if (isCreator) {
        if (permissions !== undefined) notebook.permissions = permissions;
        if (collaborators !== undefined) {
          // Ensure collaborators is an array of user IDs
          let collaboratorIds = [];
          if (Array.isArray(collaborators)) {
            collaboratorIds = collaborators.map(c => typeof c === 'string' ? c : c._id || c.id).filter(Boolean);
          }
          notebook.collaborators = collaboratorIds;
        }
        if (urlIdentifier !== undefined) notebook.urlIdentifier = urlIdentifier;

        // Handle password: hash if provided, remove if empty string
        if (password !== undefined) {
          notebook.password = password === '' ? null : await bcrypt.hash(password, 12);
        }
      }
    }

    // Increment version on update
    notebook.version += 1;
    notebook.updatedAt = new Date();

    await notebook.save();

    // Populate collaborators for response
    await notebook.populate('collaborators', 'name email');

    // Emit real-time update for all users
    const io = getIO(req);
    if (io) {
      io.emit('notebookUpdated', {
        id: notebook._id,
        title: notebook.title,
        content: extractContentFromXML(notebook.content), // Send plain content to frontend
        permissions: notebook.permissions,
        collaborators: notebook.collaborators,
        tags: notebook.tags,
        editorMode: notebook.editorMode,
        language: notebook.language,
        autoSave: notebook.autoSave,
        urlIdentifier: notebook.urlIdentifier,
        version: notebook.version,
        updatedAt: notebook.updatedAt
      });
    }

    const message = isPublicNotebook && !isAuthenticated ?
      'Notebook updated successfully (public edit)' :
      'Notebook updated successfully';

    res.json({
      notebook: {
        _id: notebook._id,
        title: notebook.title,
        content: extractContentFromXML(notebook.content), // Send plain content to frontend
        permissions: notebook.permissions,
        collaborators: notebook.collaborators,
        tags: notebook.tags,
        editorMode: notebook.editorMode,
        language: notebook.language,
        autoSave: notebook.autoSave,
        urlIdentifier: notebook.urlIdentifier,
        version: notebook.version,
        updatedAt: notebook.updatedAt
      },
      message
    });
  } catch (error) {
    console.error('Error updating notebook:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update notebook'
    });
  }
});



// Delete notebook
router.delete('/:id', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized, user not found' });
    }

    const notebook = await Notebook.findById(req.params.id);

    if (!notebook) {
      return res.status(404).json({ message: 'Notebook not found' });
    }

    if (notebook.creatorID.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Only the creator can delete this notebook' });
    }

    await Notebook.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notebook deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==== DEDICATED SETTINGS ROUTES ====

// Update notebook password
router.put('/:id/password', verifyToken, catchAsync(async (req, res) => {
  const { password, requiresPassword } = req.body;
  
  console.log('Password update request:', { 
    notebookId: req.params.id, 
    requiresPassword, 
    hasPassword: !!password,
    passwordLength: password ? password.length : 0
  });
  
  const notebook = await Notebook.findById(req.params.id);
  
  if (!notebook) {
    return res.status(404).json({ 
      error: 'Notebook not found',
      message: 'The notebook you are trying to update does not exist'
    });
  }

  console.log('Current notebook password status:', { 
    hasCurrentPassword: !!notebook.password,
    currentRequiresPassword: !!notebook.password 
  });

  // Only creator can change password
  if (notebook.creatorID.toString() !== req.user.id.toString()) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Only the creator can change the password'
    });
  }

  // Handle password setting/removing
  if (requiresPassword === false || password === '' || password === null) {
    // Remove password protection
    notebook.password = null;
    console.log('Removing password protection for notebook:', notebook._id);
    logger.info(`Password protection removed for notebook ${notebook._id}`);
  } else if (password && password.trim().length > 0) {
    // Set/update password
    if (password.length < 4) {
      return res.status(400).json({
        error: 'Password too short',
        message: 'Password must be at least 4 characters long'
      });
    }
    notebook.password = await bcrypt.hash(password.trim(), 12);
    console.log('Setting password protection for notebook:', notebook._id);
    logger.info(`Password protection added/updated for notebook ${notebook._id}`);
  } else {
    console.log('Invalid password data received:', { password, requiresPassword });
    return res.status(400).json({
      error: 'Invalid password',
      message: 'Please provide a valid password or set requiresPassword to false to remove protection'
    });
  }

  await notebook.save();
  
  // Verify the save was successful by re-querying the document
  const updatedNotebook = await Notebook.findById(req.params.id);
  
  console.log('Password updated successfully. New status:', { 
    hasPassword: !!updatedNotebook.password,
    requiresPassword: !!updatedNotebook.password,
    passwordLength: updatedNotebook.password ? updatedNotebook.password.length : 0
  });

  // Notify collaborators in real-time
  const io = getIO(req);
  if (io) {
    io.to(notebook._id.toString()).emit('settingsUpdated', {
      notebookId: notebook._id,
      settings: { 
        requiresPassword: !!notebook.password 
      },
      updatedBy: {
        id: req.user.id,
        name: req.user.name
      }
    });
  }

  res.json({
    message: notebook.password ? 'Password protection enabled' : 'Password protection disabled',
    requiresPassword: !!notebook.password,
    _id: notebook._id,
    urlIdentifier: notebook.urlIdentifier
  });
}));

// Update notebook permissions (single route)
router.put('/:id/permissions', verifyToken, catchAsync(async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;
  
  console.log('Updating permissions for notebook:', id, 'with permissions:', permissions);

  if (!['everyone', 'collaborators', 'private'].includes(permissions)) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Invalid permission value. Must be one of: everyone, collaborators, private'
    });
  }

  const notebook = await Notebook.findById(id);

  if (!notebook) {
    console.error('Notebook not found for permissions update:', id);
    return res.status(404).json({
      error: 'Not found',
      message: 'Notebook not found'
    });
  }

  // Only creator can change permissions
  if (notebook.creatorID.toString() !== req.user.id.toString()) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only the creator can change access permissions'
    });
  }

  // Update permissions
  notebook.permissions = permissions;
  await notebook.save();

  console.log('Permissions updated successfully for notebook:', id);

  // Notify collaborators in real-time
  const io = getIO(req);
  if (io) {
    io.to(notebook._id.toString()).emit('settingsUpdated', {
      notebookId: notebook._id,
      settings: { permissions },
      updatedBy: {
        id: req.user.id,
        name: req.user.name
      }
    });
  }

  res.json({
    message: 'Permissions updated successfully',
    permissions: notebook.permissions,
    _id: notebook._id,
    urlIdentifier: notebook.urlIdentifier
  });
}));

// Update notebook collaborators
router.put('/:id/collaborators', verifyToken, catchAsync(async (req, res) => {
  const { collaborators } = req.body;

  try {
    const notebook = await Notebook.findById(req.params.id);

    if (!notebook) {
      return res.status(404).json({
        error: 'Notebook not found',
        message: 'The notebook you are trying to update does not exist'
      });
    }

    if (notebook.creatorID.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only the creator can edit collaborators'
      });
    }

    // Validate collaborators is an array
    if (!Array.isArray(collaborators)) {
      return res.status(400).json({
        error: 'Invalid collaborators',
        message: 'Collaborators must be an array of user IDs'
      });
    }

    // Ensure collaborators is an array of user IDs
    const collaboratorIds = collaborators
      .map(c => typeof c === 'string' ? c : c._id || c.id)
      .filter(Boolean);

    notebook.collaborators = collaboratorIds;
    await notebook.save();

    // Populate collaborators for response
    await notebook.populate('collaborators', 'name email');

    logger.info(`Collaborators updated for notebook ${notebook._id}, count: ${collaboratorIds.length}`);

    res.json({
      message: 'Collaborators updated successfully',
      collaborators: notebook.collaborators
    });
  } catch (error) {
    logger.error('Error updating notebook collaborators:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update collaborators. Please try again.'
    });
  }
}));

// Update notebook custom URL
router.put('/:id/settings/url', verifyToken, validateUrlUpdate, catchAsync(async (req, res) => {
  const { id } = req.params;
  const { urlIdentifier } = req.body;

  const notebook = await Notebook.findById(id);

  if (!notebook) {
    return res.status(404).json({
      error: 'Not found',
      message: 'Notebook not found'
    });
  }

  // Only creator can change URL
  if (notebook.creatorID.toString() !== req.user.id.toString()) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only the creator can change the URL'
    });
  }

  // Check if URL is already in use
  const existingNotebook = await Notebook.findOne({ urlIdentifier, _id: { $ne: id } });
  if (existingNotebook) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'This URL is already in use'
    });
  }

  // Update URL
  notebook.urlIdentifier = urlIdentifier;
  await notebook.save();

  // Notify collaborators in real-time
  const io = getIO(req);
  if (io) {
    io.to(notebook._id.toString()).emit('settingsUpdated', {
      notebookId: notebook._id,
      settings: { urlIdentifier },
      updatedBy: {
        id: req.user.id,
        name: req.user.name
      }
    });
  }

  res.json({
    message: 'URL updated successfully',
    urlIdentifier: notebook.urlIdentifier
  });
}));

// Update all notebook settings at once
router.put('/:id/settings', verifyToken, catchAsync(async (req, res) => {
  const { id } = req.params;
  const { password, permissions, collaborators, tags, requiresPassword, urlIdentifier } = req.body;

  const notebook = await Notebook.findById(id);

  if (!notebook) {
    return res.status(404).json({
      error: 'Not found',
      message: 'Notebook not found'
    });
  }

  // Check if user is creator (full permissions) or collaborator (limited permissions)
  const isCreator = notebook.creatorID.toString() === req.user.id.toString();

  if (!isCreator) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only the creator can change all settings at once'
    });
  }

  // Update password if provided
  if (requiresPassword !== undefined) {
    if (requiresPassword && password) {
      notebook.password = await bcrypt.hash(password, 12);
    } else if (!requiresPassword) {
      notebook.password = null;
    }
  }

  // Update other settings if provided
  if (permissions) notebook.permissions = permissions;
  if (collaborators) notebook.collaborators = collaborators;
  if (tags) notebook.tags = tags;

  // Handle URL identifier change separately to validate uniqueness
  if (urlIdentifier && urlIdentifier !== notebook.urlIdentifier) {
    const existingNotebook = await Notebook.findOne({
      urlIdentifier,
      _id: { $ne: id }
    });

    if (existingNotebook) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'This URL is already in use'
      });
    }

    notebook.urlIdentifier = urlIdentifier;
  }

  await notebook.save();

  // Populate collaborator details for response
  if (collaborators) {
    await notebook.populate('collaborators', 'name email');
  }

  // Notify collaborators in real-time
  const io = getIO(req);
  if (io) {
    io.to(notebook._id.toString()).emit('settingsUpdated', {
      notebookId: notebook._id,
      settings: {
        permissions: notebook.permissions,
        requiresPassword: !!notebook.password,
        collaborators: notebook.collaborators.map(c => ({
          id: c._id,
          name: c.name,
          email: c.email
        })),
        tags: notebook.tags,
        urlIdentifier: notebook.urlIdentifier
      },
      updatedBy: {
        id: req.user.id,
        name: req.user.name
      }
    });
  }

  res.json({
    message: 'Settings updated successfully',
    settings: {
      requiresPassword: !!notebook.password,
      permissions: notebook.permissions,
      collaborators: notebook.collaborators,
      tags: notebook.tags,
      urlIdentifier: notebook.urlIdentifier
    }
  });
}));

// Update notebook tags
router.put('/:id/tags', verifyToken, catchAsync(async (req, res) => {
  const { tags } = req.body;

  if (!Array.isArray(tags)) {
    return res.status(400).json({
      error: 'Invalid tags format',
      message: 'Tags must be an array of strings.'
    });
  }

  try {
    const notebook = await Notebook.findById(req.params.id);

    if (!notebook) {
      return res.status(404).json({
        error: 'Notebook not found',
        message: 'The notebook you are trying to update does not exist.'
      });
    }

    if (notebook.creatorID.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only the creator can update the tags.'
      });
    }

    notebook.tags = tags;
    await notebook.save();

    res.json({
      message: 'Tags updated successfully',
      tags: notebook.tags
    });
  } catch (error) {
    logger.error('Error updating notebook tags:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update tags. Please try again.'
    });
  }
}));

module.exports = router;
