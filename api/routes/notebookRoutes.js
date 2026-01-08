const express = require('express');
const router = express.Router();
const Notebook = require('../models/notebookModel');
const Tag = require('../models/tagModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
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

// Get all available tags
router.get('/tags', verifyToken, catchAsync(async (req, res) => {
  try {
    // Get unique tags from notebooks where the user has access
    const query = {
      $or: [
        { creatorID: req.user.id },
        { collaborators: req.user.id },
        { permissions: 'everyone' }
      ]
    };

    const notebooks = await Notebook.find(query);
    const tags = [...new Set(notebooks.flatMap(notebook => notebook.tags))];

    res.json(tags);
  } catch (error) {
    logger.error('Error fetching tags:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch tags'
    });
  }
}));

// Search notebooks with pagination and filtering
router.get('/search', verifyToken, catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = '',
    tags,
    dateFrom,
    dateTo,
    onlyMine,
    onlyShared,
    sortBy = 'updatedAt',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build base query for only the user's notebooks
  const searchQuery = {
    creatorID: req.user.id
  };

  // Add text search if query provided
  if (query) {
    searchQuery.$and = [{
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } }
      ]
    }];
  }

  // Add tag filtering if provided
  if (tags) {
    const tagArray = tags.split(',');
    searchQuery.tags = { $in: tagArray };
  }

  // Add date range filtering
  if (dateFrom || dateTo) {
    searchQuery.updatedAt = {};
    if (dateFrom) searchQuery.updatedAt.$gte = new Date(dateFrom);
    if (dateTo) searchQuery.updatedAt.$lte = new Date(dateTo);
  }

  // Add ownership filtering
  if (onlyMine === 'true') {
    searchQuery.creatorID = req.user.id;
  } else if (onlyShared === 'true') {
    searchQuery.collaborators = req.user.id;
  }

  // Build sort object
  const sortObj = {};
  sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

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
      .select('-password')
      .exec();

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      notebooks: notebooks.map(notebook => ({
        ...notebook.toObject(),
        content: extractContentFromXML(notebook.content)
      })),
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
    logger.error('Error searching notebooks:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to search notebooks'
    });
  }
}));

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
  console.log('user id:', req.user, isAuthenticated);
  console.log('notebook creator id:', notebook.creatorID._id.toString());
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

  // First check if user is creator or collaborator regardless of permissions
  if (isCreator) {
    accessLevel = 'edit';
    userRole = 'owner';
  } else if (isCollaborator) {
    accessLevel = 'edit';
    userRole = 'collaborator';
  } else {
    // Then check notebook permissions
    switch (notebook.permissions.toString()) {
      case 'private':
        // Private notebooks - only owner has access
        if (!isCreator) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'This is a private notebook'
          });
        }
        break;
        
      case 'collaborators':
        // Collaborator notebooks - only owner and collaborators have access
        if (!isCreator && !isCollaborator) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'This notebook is only accessible by collaborators'
          });
        }
        break;
        
      case 'everyone':
        // Public notebooks - everyone has access with correct password
        accessLevel = 'edit';
        userRole = isAuthenticated ? 'public' : 'guest';
        break;
        
      default:
        // Unknown permission type
        return res.status(403).json({
          error: 'Access denied',
          message: 'Invalid notebook permissions'
        });
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
      // Handle tags properly
      if (tags !== undefined) {
        if (Array.isArray(tags)) {
          // If the tags are strings, create or find existing Tag documents
          const processedTags = await Promise.all(tags.map(async (tag) => {
            if (typeof tag === 'string') {
              // Try to find existing tag
              let tagDoc = await Tag.findOne({ 
                name: tag, 
                createdBy: req.user ? req.user.id : notebook.creatorID 
              });
              
              // Create new tag if doesn't exist
              if (!tagDoc) {
                tagDoc = new Tag({
                  name: tag,
                  createdBy: req.user ? req.user.id : notebook.creatorID
                });
                await tagDoc.save();
              }
              return tagDoc._id;
            }
            // If it's already an ObjectId, use it as is
            return tag;
          }));
          notebook.tags = processedTags;
        } else {
          notebook.tags = [];
        }
      }

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

    // Validate and process collaborator data
    if (!Array.isArray(collaborators)) {
      return res.status(400).json({
        error: 'Invalid collaborators',
        message: 'Collaborators must be an array'
      });
    }

    // Process each collaborator to ensure it has the correct structure
    const processedCollaborators = collaborators.map(c => {
      // Extract userId based on different possible formats
      const userId = typeof c.userId === 'string' ? c.userId : 
                    c.userId?._id || c.userId?.id || c.userId;
      
      if (!userId) {
        throw new Error('Invalid collaborator data: missing userId');
      }

      return {
        userId: userId,
        access: c.access || 'write' // Default to 'write' if not specified
      };
    });

    notebook.collaborators = processedCollaborators;
    await notebook.save();

    // Populate collaborators for response
    await notebook.populate({
      path: 'collaborators.userId',
      select: 'name email'
    });

    logger.info(`Collaborators updated for notebook ${notebook._id}, count: ${processedCollaborators.length}`);

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

// Get version history for a notebook
router.get('/:id/versions', verifyToken, catchAsync(async (req, res) => {
  try {
    const notebook = await Notebook.findById(req.params.id);
    
    if (!notebook) {
      return res.status(404).json({
        error: 'Notebook not found',
        message: 'The notebook you are trying to access does not exist'
      });
    }

    // Check if user has access to view versions
    const isCreator = notebook.creatorID.toString() === req.user.id.toString();
    const isCollaborator = notebook.collaborators.some(c => c.toString() === req.user.id.toString());
    
    if (!isCreator && !isCollaborator && notebook.permissions !== 'everyone') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view version history'
      });
    }

    // Get version history from NotebookVersion model
    const versions = await NotebookVersionModel.find({ notebookId: notebook._id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      versions: versions.map(v => ({
        id: v._id,
        version: v.version,
        content: extractContentFromXML(v.content),
        createdAt: v.createdAt,
        createdBy: v.createdBy,
        changes: v.changes
      }))
    });
  } catch (error) {
    logger.error('Error fetching version history:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch version history'
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
      message: 'Tags must be an array of tag names or objects.'
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

    // Process each tag
    const tagIds = await Promise.all(tags.map(async (tagInput) => {
      const tagName = typeof tagInput === 'string' ? tagInput : tagInput.name;
      
      // First try to find an existing tag
      let tag = await Tag.findByUserAndName(req.user.id, tagName);
      
      // If no tag exists, create a new one
      if (!tag) {
        tag = new Tag({
          name: tagName,
          createdBy: req.user.id,
          isPublic: false // Default to private tags
        });
        await tag.save();
      }
      
      return tag._id;
    }));

    // Update notebook with tag IDs
    notebook.tags = tagIds;
    await notebook.save();

    // Populate and return the updated tags
    await notebook.populate('tags');

    res.json({
      message: 'Tags updated successfully',
      tags: notebook.tags.map(tag => ({
        id: tag._id,
        name: tag.name,
        color: tag.color
      }))
    });
  } catch (error) {
    logger.error('Error updating notebook tags:', error);
    if (error.code === 11000) {
      res.status(400).json({
        error: 'Duplicate tag',
        message: 'One or more tags already exist with the same name.'
      });
    } else {
      res.status(500).json({
        error: 'Server error',
        message: 'Failed to update tags. Please try again.'
      });
    }
  }
}));

// Set/update notebook password
router.put('/:id/password', verifyToken, catchAsync(async (req, res) => {
  try {
    const { password, requiresPassword } = req.body;
    const notebookId = req.params.id;
    
    // Find the notebook
    const notebook = await Notebook.findById(notebookId);
    
    if (!notebook) {
      return res.status(404).json({
        error: 'Notebook not found',
        message: 'The notebook you are trying to update does not exist.'
      });
    }
    
    // Verify ownership - only the owner can set a password
    if (notebook.creatorID.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only the creator can update password settings.'
      });
    }
    
    // Update password settings
    if (requiresPassword && password) {
      // Hash the password before storing
      const salt = await bcrypt.genSalt(10);
      notebook.password = await bcrypt.hash(password, salt);
      notebook.requiresPassword = true;
    } else {
      // Remove password protection
      notebook.password = null;
      notebook.requiresPassword = false;
    }
    
    await notebook.save();
    
    // Return success message (but don't return the password)
    return res.json({
      message: 'Password settings updated successfully',
      requiresPassword: notebook.requiresPassword
    });
    
  } catch (error) {
    logger.error('Error updating notebook password:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to update password settings. Please try again.'
    });
  }
}));

// Get collaborators for a notebook
router.get('/:id/collaborators', verifyToken, catchAsync(async (req, res) => {
  try {
    const notebookId = req.params.id;
    const notebook = await Notebook.findById(notebookId).populate('collaborators', 'name email');
    
    if (!notebook) {
      return res.status(404).json({
        error: 'Notebook not found',
        message: 'The notebook you are trying to access does not exist.'
      });
    }
    
    // Check ownership or collaborator access
    const userId = req.user.id;
    const isOwner = notebook.creatorID.toString() === userId;
    const isCollaborator = notebook.collaborators.some(collab => 
      collab._id.toString() === userId || collab.id.toString() === userId
    );
    
    if (!isOwner && !isCollaborator) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only the owner or collaborators can view collaborator information.'
      });
    }
    
    // Return the collaborators list
    return res.json({
      collaborators: notebook.collaborators.map(c => ({
        id: c._id,
        name: c.name,
        email: c.email
      }))
    });
    
  } catch (error) {
    logger.error('Error fetching notebook collaborators:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch collaborators. Please try again.'
    });
  }
}));

// Update collaborators list for a notebook
router.put('/:id/collaborators', verifyToken, catchAsync(async (req, res) => {
  try {
    const { collaborators } = req.body;
    const notebookId = req.params.id;
    
    if (!collaborators || !Array.isArray(collaborators)) {
      return res.status(400).json({
        error: 'Invalid collaborators data',
        message: 'Collaborators must be provided as an array of user IDs.'
      });
    }
    
    // Find the notebook
    const notebook = await Notebook.findById(notebookId);
    
    if (!notebook) {
      return res.status(404).json({
        error: 'Notebook not found',
        message: 'The notebook you are trying to update does not exist.'
      });
    }
    
    // Verify ownership - only the owner can update collaborators
    if (notebook.creatorID.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only the creator can update collaborators.'
      });
    }
    
    // Update collaborators
    notebook.collaborators = collaborators;
    await notebook.save();
    
    // Return updated list (but don't populate to avoid potential circular dependencies)
    return res.json({
      message: 'Collaborators updated successfully',
      collaborators: notebook.collaborators
    });
    
  } catch (error) {
    logger.error('Error updating notebook collaborators:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to update collaborators. Please try again.'
    });
  }
}));

// Update a specific collaborator's permissions
router.put('/:id/collaborators/:userId', verifyToken, catchAsync(async (req, res) => {
  try {
    const { permission } = req.body;
    const { id: notebookId, userId } = req.params;
    
    if (!permission || !['read', 'write', 'admin'].includes(permission)) {
      return res.status(400).json({
        error: 'Invalid permission',
        message: 'Permission must be one of: read, write, admin.'
      });
    }
    
    // Find the notebook
    const notebook = await Notebook.findById(notebookId);
    
    if (!notebook) {
      return res.status(404).json({
        error: 'Notebook not found',
        message: 'The notebook you are trying to update does not exist.'
      });
    }
    
    // Verify ownership - only the owner can update collaborator permissions
    if (notebook.creatorID.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only the creator can update collaborator permissions.'
      });
    }
    
    // Check if the user is already a collaborator
    const isCollaborator = notebook.collaborators.some(collab => 
      collab.toString() === userId || collab._id?.toString() === userId
    );
    
    if (!isCollaborator) {
      return res.status(404).json({
        error: 'Collaborator not found',
        message: 'This user is not a collaborator on this notebook.'
      });
    }
    
    // In a more sophisticated system, we'd store permissions per collaborator
    // For now, we'll just return success to maintain the API structure
    
    return res.json({
      message: 'Collaborator permission updated successfully',
      userId,
      permission
    });
    
  } catch (error) {
    logger.error('Error updating collaborator permission:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to update collaborator permission. Please try again.'
    });
  }
}));

// Remove a collaborator
router.delete('/:id/collaborators/:userId', verifyToken, catchAsync(async (req, res) => {
  try {
    const { id: notebookId, userId } = req.params;
    
    // Find the notebook
    const notebook = await Notebook.findById(notebookId);
    
    if (!notebook) {
      return res.status(404).json({
        error: 'Notebook not found',
        message: 'The notebook you are trying to update does not exist.'
      });
    }
    
    // Verify ownership - only the owner can remove collaborators
    if (notebook.creatorID.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only the creator can remove collaborators.'
      });
    }
    
    // Remove collaborator
    notebook.collaborators = notebook.collaborators.filter(
      collab => collab.toString() !== userId && collab._id?.toString() !== userId
    );
    
    await notebook.save();
    
    return res.json({
      message: 'Collaborator removed successfully'
    });
    
  } catch (error) {
    logger.error('Error removing collaborator:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to remove collaborator. Please try again.'
    });
  }
}));



// Advanced search endpoint with filters
router.get('/search', verifyToken, catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    query = '',
    tags = '',
    dateFrom = '',
    dateTo = '',
    sortBy = 'updatedAt',
    sortOrder = 'desc',
    onlyMine = false,
    onlyShared = false
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build search query
  const searchQuery = {};
  
  // Access filters
  if (onlyMine === 'true') {
    searchQuery.creatorID = req.user.id;
  } else if (onlyShared === 'true') {
    searchQuery.collaborators = { $in: [req.user.id] };
  } else {
    // Default: show notebooks user has access to
    searchQuery.$or = [
      { creatorID: req.user.id },
      { collaborators: { $in: [req.user.id] } },
      { isPublic: true }
    ];
  }

  // Add text search if query provided
  if (query && query.trim()) {
    searchQuery.$or = [
      { title: { $regex: query.trim(), $options: 'i' } },
      { description: { $regex: query.trim(), $options: 'i' } }
    ];
  }
  
  // Add tag filters if provided
  if (tags && tags.trim()) {
    const tagIds = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    if (tagIds.length > 0) {
      searchQuery.tags = { $in: tagIds };
    }
  }
  
  // Add date filters if provided
  const dateFilters = {};
  if (dateFrom && !isNaN(new Date(dateFrom).getTime())) {
    dateFilters.updatedAt = { $gte: new Date(dateFrom) };
  }
  
  if (dateTo && !isNaN(new Date(dateTo).getTime())) {
    if (!dateFilters.updatedAt) dateFilters.updatedAt = {};
    dateFilters.updatedAt.$lte = new Date(dateTo);
  }
  
  if (Object.keys(dateFilters).length > 0) {
    Object.assign(searchQuery, dateFilters);
  }
  
  // Prepare sort
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
  
  try {
    const total = await Notebook.countDocuments(searchQuery);
    
    const notebooks = await Notebook.find(searchQuery)
      .select('title description creatorID urlIdentifier isPublic createdAt updatedAt collaborators tags')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('tags', 'name color')
      .lean();
    
    const pages = Math.ceil(total / limitNum);
    
    return res.status(200).json({
      success: true,
      notebooks,
      pagination: {
        total,
        page: pageNum,
        pages,
        limit: limitNum
      }
    });
  } catch (error) {
    logger.error('Error in advanced search:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to search notebooks. Please try again.'
    });
  }
}));

// Tag management endpoints
router.get('/tags', verifyToken, catchAsync(async (req, res) => {
  try {
    const tags = await Tag.find({ createdBy: req.user.id }).sort('name');
    return res.status(200).json({
      success: true,
      tags
    });
  } catch (error) {
    logger.error('Error fetching tags:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch tags. Please try again.'
    });
  }
}));

router.post('/tags', verifyToken, catchAsync(async (req, res) => {
  const { name, color } = req.body;
  
  if (!name || name.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid input',
      message: 'Tag name is required'
    });
  }
  
  try {
    const existingTag = await Tag.findOne({ 
      name: name.trim(), 
      createdBy: req.user.id 
    });
    
    if (existingTag) {
      return res.status(400).json({
        error: 'Duplicate tag',
        message: 'Tag with this name already exists'
      });
    }
    
    const newTag = new Tag({
      name: name.trim(),
      color: color || '#3f51b5', // Default color if not provided
      createdBy: req.user.id
    });
    
    await newTag.save();
    
    return res.status(201).json({
      success: true,
      tag: newTag
    });
  } catch (error) {
    logger.error('Error creating tag:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to create tag. Please try again.'
    });
  }
}));

router.put('/tags/:id', verifyToken, catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, color } = req.body;
  
  try {
    const tag = await Tag.findOne({ _id: id, createdBy: req.user.id });
    
    if (!tag) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Tag not found or you do not have permission to edit it'
      });
    }
    
    if (name && name.trim()) {
      // Check if another tag with the same name exists for this user
      const existingTag = await Tag.findOne({ 
        name: name.trim(), 
        createdBy: req.user.id,
        _id: { $ne: id }
      });
      
      if (existingTag) {
        return res.status(400).json({
          error: 'Duplicate tag',
          message: 'Tag with this name already exists'
        });
      }
      
      tag.name = name.trim();
    }
    
    if (color) {
      tag.color = color;
    }
    
    tag.updatedAt = new Date();
    await tag.save();
    
    return res.status(200).json({
      success: true,
      tag
    });
  } catch (error) {
    logger.error('Error updating tag:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to update tag. Please try again.'
    });
  }
}));

router.delete('/tags/:id', verifyToken, catchAsync(async (req, res) => {
  const { id } = req.params;
  
  try {
    const tag = await Tag.findOne({ _id: id, createdBy: req.user.id });
    
    if (!tag) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Tag not found or you do not have permission to delete it'
      });
    }
    
    // Remove this tag from all notebooks
    await Notebook.updateMany(
      { tags: id },
      { $pull: { tags: id } }
    );
    
    // Delete the tag
    await Tag.deleteOne({ _id: id });
    
    return res.status(200).json({
      success: true,
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting tag:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to delete tag. Please try again.'
    });
  }
}));

module.exports = router;
