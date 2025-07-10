// Update notebook password
router.put('/:id/password', verifyToken, catchAsync(async (req, res) => {
  const { password } = req.body;

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
        message: 'Only the creator can edit the password' 
      });
    }

    // Handle password: hash if provided, remove if empty string
    notebook.password = password === '' ? null : await bcrypt.hash(password, 12);
    await notebook.save();

    logger.info(`Password ${password ? 'set' : 'removed'} for notebook ${notebook._id}`);

    res.json({ 
      message: `Password ${password ? 'set' : 'removed'} successfully`,
      passwordProtected: !!password
    });
  } catch (error) {
    logger.error('Error updating notebook password:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'Failed to update password. Please try again.' 
    });
  }
}));
