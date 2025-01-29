const express = require('express'); // Framework for web servers and APIs
const cors = require('cors'); // Middleware for enabling CORS to communicate between frontend and backend
const mongoose = require('mongoose');
const fs = require('fs'); // Work with file systems
require('dotenv').config(); // Load environment variables from a .env file
const employeeRoutes = require('./routes/employeeRoutes'); // Contains URLs to API requests
const path = require('path');
const xssClean = require('xss-clean');

const app = express();

// Apply XSS clean middleware
app.use(xssClean());

// Validate required environment variables
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set in the environment variables.');
  process.exit(1); // Exit the process if MONGODB_URI is not set
}

// Middleware to parse incoming JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add this line to parse form data

// CORS middleware (cess your resources. This helps)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000', // Allow React frontend, fallback to localhost if not set
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow headers
    credentials: true, // Allow cookies if needed
  })
);

// MongoDB connection with retry logic
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    setTimeout(connectToMongoDB, 5000); // Retry connection after 5 seconds
  }
};

connectToMongoDB(); // Initial MongoDB connection attempt

// Use the employee routes
app.use('/api', employeeRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is running successfully!' });
});

// General error handling middleware for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack); // Log full stack trace for debugging
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server with better error handling for port binding
const getAvailablePort = async (port) => {
  try {
    const server = await app.listen(port);
    return server;
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use, trying the next one...`);
      return getAvailablePort(port + 1); // Try the next port if current one is in use
    }
    throw err; // Rethrow error if it's something else
  }
};

// Start the server
const PORT = parseInt(process.env.PORT, 10) || 5001;
getAvailablePort(PORT)
  .then((server) => {
    console.log(`Server running on port ${server.address().port}`);
  })
  .catch((err) => {
    console.error('Error starting server:', err);
    process.exit(1); // Exit if there's an error starting the server
  });
