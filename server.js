/**
 * Main server file for Professional Registry System
 * ITI-821 Advanced Database Course
 * 
 * This server integrates Express.js with Apollo GraphQL Server
 * and provides both REST and GraphQL endpoints for data access
 */

const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
require('./gridfs/bucket'); // warms up the bucket on "open"


// Import GraphQL schemas and resolvers
const { typeDefs, resolvers } = require('./graphql');

// Import REST routes
const professionalsRoutes = require('./routes/professionals');
const employersRoutes = require('./routes/employers');
const applicationsRoutes = require('./routes/applications');
const curriculumPhotosRouter = require('./routes/curriculum.photos'); // Import Curriculum photos routes

// Import database configuration
const { connectDB } = require('./config/database');




/**
 * Initialize Express application
 */
const app = express();
const PORT = process.env.PORT || 4000;

/**
 * Middleware configuration
 */
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * REST API Routes
 * These routes handle data registration and bulk operations
 */
app.use('/api/professionals', professionalsRoutes);
app.use('/api/employers', employersRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/curricula', curriculumPhotosRouter); 

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Professional Registry System is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    features: [
      'Professional Registration',
      'Employer Registration', 
      'Job Offers Management',
      'Job Applications System',
      'GraphQL API',
      'REST API'
    ]
  });
});

/**
 * API Documentation endpoint
 */
app.get('/api', (req, res) => {
  res.json({
    message: 'Professional Registry System API',
    version: '1.0.0',
    endpoints: {
      rest: {
        professionals: '/api/professionals',
        employers: '/api/employers',
        applications: '/api/applications'
      },
      graphql: process.env.GRAPHQL_PATH || '/graphql',
      health: '/health'
    },
    features: {
      applications: {
        'Monthly limit': '3 applications per professional per month',
        'Duplicate prevention': 'Cannot apply twice to same job offer',
        'Status workflow': 'Pending → Accepted/Rejected'
      }
    }
  });
});

/**
 * Initialize Apollo GraphQL Server
 */
async function startApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // Add context data that will be available in all resolvers
      return {
        // Future: Add authentication context
        // user: req.user,
        // Add request object for logging
        req
      };
    },
    // Enable GraphQL Playground in development
    introspection: process.env.NODE_ENV === 'development',
    playground: process.env.NODE_ENV === 'development'
  });

  // Start the server
  await server.start();
  
  // Apply Apollo GraphQL middleware to Express
  server.applyMiddleware({ 
    app, 
    path: process.env.GRAPHQL_PATH || '/graphql' 
  });

  return server;
}

/**
 * Start the application
 */
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ MongoDB connected successfully');

    // Initialize Apollo Server
    const apolloServer = await startApolloServer();
    console.log('✅ Apollo GraphQL Server initialized');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 GraphQL Playground: http://localhost:${PORT}${apolloServer.graphqlPath}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`📋 REST API Documentation: http://localhost:${PORT}/api`);
    });

  } catch (error) {
    console.error('❌ Error starting server:', error.message);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handling
 */
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

// Start the server
startServer();