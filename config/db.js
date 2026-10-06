const mongoose = require('mongoose');

let isConnected = false;
let connectionError = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    isConnected = false;
    connectionError = 'MONGODB_URI is not configured. Records will only be held in memory until the server stops.';
    console.warn(`⚠️ [Database] ${connectionError}`);
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    connectionError = null;
    console.log(`✅ [MongoDB Atlas] Database Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    isConnected = false;
    connectionError = error.message;
    console.warn(`⚠️ [MongoDB Atlas] Connection notice: ${error.message}`);
    console.log('ℹ️ Server is running without persistent database storage.');
    return null;
  }
};

const getDbStatus = () => {
  return {
    connected: isConnected,
    database: mongoose.connection.name || 'expense_tracker',
    host: isConnected ? mongoose.connection.host : 'Offline/Fallback mode',
    error: connectionError,
    cluster: 'Cluster0'
  };
};

module.exports = { connectDB, getDbStatus };
