/**
 * MongoDB Database Configuration
 * ITI-821 Advanced Database Course
 * 
 * Handles MongoDB connection with Mongoose ODM
 * Includes connection options optimized for production
 */

const mongoose = require('mongoose');

/**
 * MongoDB connection configuration options
 * These options ensure optimal performance and reliability
 */
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // Maximum number of connections in the connection pool
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close connections after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  bufferCommands: false, // Disable mongoose buffering
  bufferMaxEntries: 0 // Disable mongoose buffering
};

/**
 * Connect to MongoDB database
 * @returns {Promise<void>} Promise that resolves when connected
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/profesionales_pacifica';
    
    console.log('🔄 Connecting to MongoDB...');
    console.log(`📍 Database URI: ${mongoURI.replace(/\/\/.*@/, '//***:***@')}`);
    
    const conn = await mongoose.connect(mongoURI, connectionOptions);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
    
    // Log connection events for monitoring
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    
    // Exit process with failure code if initial connection fails
    process.exit(1);
  }
};

/**
 * Close database connection
 * Used for graceful shutdown
 */
const closeConnection = async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
};

/**
 * Get connection status
 * @returns {string} Connection state
 */
const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return states[mongoose.connection.readyState] || 'unknown';
};

module.exports = {
  connectDB,
  closeConnection,
  getConnectionStatus,
  mongoose
};