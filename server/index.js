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

// Resolve client/dist path — works whether CWD is /server or project root
const fs = require('fs');
const possibleDistPaths = [
  path.join(__dirname, '..', 'client', 'dist'),  // running from /server
  path.join(__dirname, 'client', 'dist'),         // running from project root
  path.join(process.cwd(), 'client', 'dist'),     // Render sets CWD to root
  path.join(process.cwd(), '..', 'client', 'dist'),
];
const clientDistPath = possibleDistPaths.find(p => fs.existsSync(p)) || possibleDistPaths[0];
console.log(`📁 Serving client from: ${clientDistPath} (exists: ${fs.existsSync(clientDistPath)})`);

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath, {
    // Ensure JS/CSS files are served with correct MIME types
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    },
  }));
}

// SPA fallback — serves index.html for React Router routes on page refresh
// Excludes static asset paths to prevent serving index.html for JS/CSS files
app.get('*', (req, res) => {
  // If the request is for a static asset (has a file extension), return 404
  // instead of index.html to avoid MIME type mismatch errors
  if (/\.\w+$/.test(req.path) && !req.path.endsWith('.html')) {
    return res.status(404).send(`Asset not found: ${req.path}`);
  }

  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`Cannot find client build at ${clientDistPath}. Run: cd client && npm run build`);
  }
});

// Global error handler — must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`🌐 API: http://localhost:${PORT}/api/health\n`);
});

module.exports = { app, server };
