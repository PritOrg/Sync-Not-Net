const express = require('express');
const router = express.Router();
const Notebook = require('../models/notebookModel');
const User = require('../models/userModel');

// Create a new notebook
router.post('/', async (req, res) => {
  const { title, content, creatorID, permissions } = req.body;
  try {
    const notebook = new Notebook({ title, content, creatorID, permissions });
    await notebook.save();
    res.status(201).json(notebook);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all notebooks (optionally filtered by creator or collaborator)
router.get('/', async (req, res) => {
  const { userID } = req.query;  // Optional filter by creatorID or collaboratorID
  try {
    const notebooks = await Notebook.find({ $or: [{ creatorID: userID }, { collaborators: userID }] });
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
router.post('/:id/access', async (req, res) => {
  const { password } = req.body;  // The password the user provides
  try {
    const notebook = await Notebook.findById(req.params.id);
    if (!notebook) {
      return res.status(404).json({ message: 'Notebook not found' });
    }

    if (notebook.password) {
      const isMatch = await bcrypt.compare(password, notebook.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid password' });
      }
    }

    res.json(notebook);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const notebook = await Notebook.findById(req.params.id);
    if (!notebook) {
      return res.status(404).json({ message: 'Notebook not found' });
    }
    if (notebook.creatorID.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the creator can delete this notebook' });
    }
    await notebook.remove();
    res.json({ message: 'Notebook deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
