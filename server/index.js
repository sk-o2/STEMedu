require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const initSocket = require('./socket/chatSocket');

// Route imports
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const projectRoutes = require('./routes/projectRoutes');
const aiRoutes = require('./routes/aiRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const mentoringRoutes = require('./routes/mentoringRoutes');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || "http://localhost:5173" , methods: ['GET', 'POST'], credentials: true, },
});
initSocket(io);
app.set('io', io); // Make io accessible in controllers

// Security Middleware
app.use(helmet());
app.use(mongoSanitize());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

// Rate limiting (global)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Stripe webhook needs raw body — register BEFORE express.json()
app.use('/api/courses/webhook', express.raw({ type: 'application/json' }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'STEM Edu API running 🚀', env: process.env.NODE_ENV }));

// Dummy endpoint to silence browser extension rogue requests
app.all('/api/ext/*', (req, res) => res.status(200).send('OK'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/mentoring', mentoringRoutes);

// Serve React client static files
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const fs = require('fs');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// Global error handler (must be before SPA fallback so API errors return JSON)
app.use(errorHandler);

// SPA fallback — ONLY for non-API routes, serves index.html so React Router works on refresh
app.get(/^(?!\/api).*$/, (req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('Server is running. Build the client to serve the frontend.');
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`🌐 API: http://localhost:${PORT}/api/health\n`);
});

module.exports = { app, server };
