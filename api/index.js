const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const verifyToken = require('./middlewares/verifyToken');
const Notebook = require('./models/notebookModel');

// Import routes
const userRoutes = require('./routes/userRoutes');
const notebookRoutes = require('./routes/notebookRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
require('dotenv').config();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI,).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/notebooks', verifyToken, notebookRoutes);  // Protected routes

// Real-time with Socket.io
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join the notebook room based on its ID
  socket.on('joinNotebook', (notebookId) => {
    socket.join(notebookId);
    console.log(`User joined notebook room: ${notebookId}`);
  });

  // Listen for notebook content updates
  socket.on('updateNotebook', async (notebookId, updatedContent) => {
    console.log(`Notebook ${notebookId} updated by user`);

    try {
      // Update the notebook in the database
      const notebook = await Notebook.findById(notebookId);
      if (notebook) {
        notebook.title = updatedContent.title || notebook.title;
        notebook.content = updatedContent.content || notebook.content;
        notebook.version += 1; // Increment version
        await notebook.save();

        // Emit the update to everyone in the room
        io.to(notebookId).emit('notebookUpdated', notebook);
      } else {
        console.log('Notebook not found');
      }
    } catch (error) {
      console.error('Error updating notebook:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Server listening
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
