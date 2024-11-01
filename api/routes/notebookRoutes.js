const express = require('express');
const router = express.Router();
const Notebook = require('../models/notebookModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
// Save or update notebook (used for creating and saving notebooks)
router.post('/', async (req, res) => {
  const { title, content, permissions, collaborators, password, tags, editorMode, autoSave } = req.body;
  const urlIdentifier = crypto.randomBytes(8).toString('hex');  // Generate a random identifier

  try {
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const newNotebook = new Notebook({
      creatorID: req.user.id,
      title,
      content,
      permissions,
      collaborators,
      password: hashedPassword,
      tags,
      editorMode,  // Store editor mode
      autoSave,    // Store auto-save setting
      urlIdentifier,
    });

    await newNotebook.save();
    res.status(201).json(newNotebook);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error saving notebook' });
  }
});


// Get all notebooks (optionally filtered by creator or collaborator)
router.get('/', async (req, res) => {
  const { userID } = req.query;  // Optional filter by creatorID or collaboratorID
  try {
    if (userID) {
      const notebooks = await Notebook.find({ $or: [{ creatorID: userID }, { collaborators: userID }] });
      return res.json(notebooks);
    }

    const notebooks = await Notebook.find();
    res.json(notebooks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notebook access based on ID and check password
router.get('/:urlIdentifier/access', async (req, res) => {
  try {
    const notebook = await Notebook.findOne({ urlIdentifier: req.params.urlIdentifier })
      .populate('collaborators', 'name email')
      .exec();

    if (!notebook) {
      return res.status(404).json({ message: 'Notebook not found' });
    }

    const requiresPassword = !!notebook.password;

    if (requiresPassword) {
      res.status(200).json({
        _id: notebook._id,
        requiresPassword: true,
        password: notebook.password,
        title: notebook.title,
        content: notebook.content,
        collaborators: notebook.collaborators,
        tags: notebook.tags,
        permissions: notebook.permissions,
        editorMode: notebook.editorMode,
        autoSave: notebook.autoSave,
      });
    } else {
      res.status(200).json({
        _id: notebook._id,
        requiresPassword: false,
        title: notebook.title,
        content: notebook.content,
        collaborators: notebook.collaborators,
        tags: notebook.tags,
        permissions: notebook.permissions,
        editorMode: notebook.editorMode,
        autoSave: notebook.autoSave,
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notebook' });
  }
});


// Update notebook (restricted by permissions)
router.put('/:id', async (req, res) => {
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
  } = req.body;

  try {
    const notebook = await Notebook.findById(req.params.id);
    if (!notebook) {
      return res.status(404).json({ message: 'Notebook not found' });
    }

    // Check permission (if creator-only)
    if (notebook.permissions === 'creator-only' && notebook.creatorID.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the creator can edit this notebook' });
    }

    // Update fields only if provided in request body
    if (title !== undefined) notebook.title = title;
    if (content !== undefined) notebook.content = content;
    if (permissions !== undefined) notebook.permissions = permissions;
    if (collaborators !== undefined) notebook.collaborators = collaborators;
    if (editorMode !== undefined) notebook.editorMode = editorMode;
    if (autoSave !== undefined) notebook.autoSave = autoSave;
    if (tags !== undefined) notebook.tags = tags;
    if (urlIdentifier !== undefined) notebook.urlIdentifier = urlIdentifier;

    // Handle password: hash if provided, remove if empty string
    if (password !== undefined) {
      notebook.password = password === '' ? null : await bcrypt.hash(password, 10);
    }

    // Increment version on update
    notebook.version += 1;

    await notebook.save();
    res.json(notebook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/url', async (req, res) => {
  const { urlIdentifier } = req.body;

  try {
    const notebook = await Notebook.findById(req.params.id);

    if (!notebook) {
      return res.status(404).json({ message: 'Notebook not found' });
    }

    if (notebook.creatorID.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the creator can edit the URL' });
    }

    // Check if the new identifier is unique
    const existingNotebook = await Notebook.findOne({ urlIdentifier });
    if (existingNotebook) {
      return res.status(400).json({ message: 'URL identifier already in use' });
    }

    notebook.urlIdentifier = urlIdentifier;
    await notebook.save();

    res.json({ message: 'URL updated successfully', notebook });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

    if (notebook.creatorID.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the creator can delete this notebook' });
    }

    await Notebook.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notebook deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
