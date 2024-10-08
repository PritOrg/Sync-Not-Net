const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const verifyToken = require("./middlewares/verifyToken");
require("./config/passport");
const passport = require("passport");
const session = require("express-session");
require("dotenv").config();

// Import routes
const userRoutes = require("./routes/userRoutes");
const notebookRoutes = require("./routes/notebookRoutes");

const app = express();
const server = http.createServer(app);
// const session = require('express-session');
// const passport = require('passport');
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/notebooks", verifyToken, notebookRoutes); // Protected routes
const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

// Real-time with Socket.io
io.on("connection", (socket) => {
  console.log("New client connected: ", socket.id);

  // Join the notebook room based on its ID
  socket.on("joinNotebook", (notebookId) => {
    socket.join(notebookId);
    console.log(`User joined notebook room: ${notebookId}`);
  });

  // Listen for notebook content updates
  socket.on("updateNotebook", (notebookId, updatedContent) => {
    console.log(`Notebook ${notebookId} updated by user`);

    // Emit the update to everyone in the room
    io.to(notebookId).emit("notebookUpdated", updatedContent);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Server listening
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
