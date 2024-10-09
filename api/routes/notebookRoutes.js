const express = require('express');
const router = express.Router();
const Notebook = require('../models/notebookModel');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');

// Save or update notebook (used for creating and saving notebooks)
router.post('/', async (req, res) => {
  const { title, content, permissions, collaborators, password, tags } = req.body;

  try {
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const newNotebook = new Notebook({
      title,
      content,
      permissions,
      collaborators,
      password: hashedPassword,
      tags,
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
      res.json(notebooks);
    }

    const notebooks = await Notebook.find();
    res.json(notebooks);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific notebook by ID
// router.get('/:id', async (req, res) => {
//   try {
//     const notebook = await Notebook.findById(req.params.id).populate('creatorID collaborators');
//     if (!notebook) {
//       return res.status(404).json({ message: 'Notebook not found' });
//     }
//     res.json(notebook);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// Get notebook (with password protection)
// Get notebook access based on ID and check password
router.get('/:id/access', async (req, res) => {
  try {
    const notebook = await Notebook.findById(req.params.id);

    if (!notebook) {
      return res.status(404).json({ message: 'Notebook not found' });
    }

    const requiresPassword = notebook.password ? true : false;
    
    if (requiresPassword) {
      res.status(200).json({
        requiresPassword: true,
        password: notebook.password, // Send hashed password to compare on frontend
        title: notebook.title,
        content: notebook.content,
        collaborators: notebook.collaborators,
        permissions: notebook.permissions,
      });
    } else {
      res.status(200).json({
        requiresPassword: false,
        title: notebook.title,
        content: notebook.content,
        collaborators: notebook.collaborators,
        permissions: notebook.permissions,
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notebook' });
  }
});


// Update notebook (restricted by permissions)
router.put('/:id', async (req, res) => {
  const { title, content, permissions, collaborators } = req.body;
  try {
    const notebook = await Notebook.findById(req.params.id);
    if (!notebook) {
      return res.status(404).json({ message: 'Notebook not found' });
    }
    // Check permission (if creator-only)
    if (notebook.permissions === 'creator-only' && notebook.creatorID.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only creator can edit this notebook' });
    }
    notebook.title = title || notebook.title;
    notebook.content = content || notebook.content;
    notebook.permissions = permissions || notebook.permissions;
    notebook.collaborators = collaborators || notebook.collaborators;
    notebook.version += 1;  // Increment version
    await notebook.save();
    res.json(notebook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete notebook
router.delete('/:id', async (req, res) => {
  try {
    // Ensure that req.user is available (this should be set by authentication middleware)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized, user not found' });
    }

    const notebook = await Notebook.findById(req.params.id);
    
    // Check if the notebook exists
    if (!notebook) {
      return res.status(404).json({ message: 'Notebook not found' });
    }

    // Ensure the creator of the notebook is the one deleting it
    if (notebook.creatorID.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the creator can delete this notebook' });
    }

    // Delete the notebook
    await Notebook.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notebook deleted' });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;
