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
  const activeUsers = new Map(); // Map of notebookId -> array of users typing

  // Join the notebook room based on its ID
  socket.on('joinNotebook', (notebookId, userId) => {
    socket.join(notebookId);
    activeUsers.set(socket.id, { notebookId, userId });
  
    // Broadcast to others in the room that a new user has joined
    socket.to(notebookId).emit('userJoined', userId);
    console.log(`User ${userId} joined notebook room: ${notebookId}`);
  });
  
  // Listen for notebook content updates and broadcast to all clients except the sender
  socket.on('updateNotebook', async (notebookId, updatedContent, userId) => {
    console.log(`Notebook ${notebookId} updated by user ${userId}`);
    try {
      // Update the notebook in the database
      const notebook = await Notebook.findById(notebookId);
      if (notebook) {
        notebook.title = updatedContent.title || notebook.title;
        notebook.content = updatedContent.content || notebook.content;
        notebook.version += 1; // Increment version
        await notebook.save();
  
        // Broadcast to all clients except the sender
        socket.to(notebookId).emit('notebookUpdated', {
          notebookId,
          title: notebook.title,
          content: notebook.content,
          userId,
        });
      }
    } catch (error) {
      console.error('Error updating notebook:', error);
    }
  });
  
  // Notify users when someone starts typing
  socket.on('typing', ({ notebookId, userId }) => {
    socket.to(notebookId).emit('userTyping', userId);
  });
  
  // Notify users when someone stops typing
  socket.on('stopTyping', ({ notebookId, userId }) => {
    socket.to(notebookId).emit('userStoppedTyping', userId);
  });
  
  // Cleanup on disconnect
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      const { notebookId, userId } = user;
      activeUsers.delete(socket.id);
      socket.to(notebookId).emit('userLeft', userId);
    }});
});

// Server listening
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
