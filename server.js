require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB, getDbStatus } = require('./config/db');

// Initialize Express app
const app = express();

// Connect to MongoDB Atlas (Non-blocking so server boots immediately)
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/public', require('./routes/public'));
app.use('/api/ai', require('./routes/ai'));

// System status route
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: getDbStatus(),
    app: 'FinPilot AI',
  });
});

// Single Page Application Fallback
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'index.html'));
  }
  next();
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 FinPilot AI financial co-pilot is running!`);
  console.log(`🌐 Local Web URL: http://localhost:${PORT}`);
  console.log(`🗄️ Storage: ${getDbStatus().connected ? 'MongoDB persistence enabled' : 'Temporary in-memory storage'}`);
  console.log(`📊 Insights: Deterministic calculations from user-recorded data`);
  console.log(`====================================================`);
});
