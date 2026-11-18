const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Prevent crashes when process runs detached without console or broken stdout pipes
const fs = require('fs');

if (process.stdout && process.stdout.on) {
  process.stdout.on('error', () => {});
}
if (process.stderr && process.stderr.on) {
  process.stderr.on('error', () => {});
}
process.on('exit', (code) => {
  if (!process.env.VERCEL) {
    try {
      fs.appendFileSync('exit.log', `[${new Date().toISOString()}] Exited with code ${code}\n`);
    } catch (_) {}
  }
});
process.on('uncaughtException', (err) => {
  if (!process.env.VERCEL) {
    try {
      fs.appendFileSync('exit.log', `[${new Date().toISOString()}] Uncaught Exception: ${err.stack || err}\n`);
    } catch (_) {}
  }
});
process.on('unhandledRejection', (err) => {
  if (!process.env.VERCEL) {
    try {
      fs.appendFileSync('exit.log', `[${new Date().toISOString()}] Unhandled Rejection: ${err.stack || err}\n`);
    } catch (_) {}
  }
});

const employeeRoutes = require('./routes/employeeRoutes');
const itemRoutes = require('./routes/itemRoutes');
const accountabilityRoutes = require('./routes/accountabilityRoutes');
const statsRoutes = require('./routes/statsRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const authRoutes = require('./routes/authRoutes');
const seedDatabase = require('./scripts/seed');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chawnah_accountability';

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Database connection caching for serverless (Vercel) & traditional Node environments
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    const sanitizedUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongooseInstance) => {
      console.log('✅ Connected to MongoDB at:', sanitizedUri);
      try {
        if (authRoutes.ensureDefaultAdmin) {
          await authRoutes.ensureDefaultAdmin();
        }
      } catch (adminErr) {
        console.warn('⚠️ Could not initialize default admin accounts:', adminErr.message);
      }
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

// Ensure database is ready before processing API requests
app.use(async (req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  if (process.env.VERCEL && !process.env.MONGODB_URI) {
    return res.status(500).json({
      error: 'Missing MONGODB_URI',
      message: 'MONGODB_URI environment variable is not configured in Vercel.',
      suggestion: 'Please add MONGODB_URI (e.g. MongoDB Atlas connection string) in your Vercel Project Settings > Environment Variables.'
    });
  }

  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ Database connection error:', err);
    res.status(500).json({
      error: 'Database connection failed',
      message: err.message,
      suggestion: 'Please verify MONGODB_URI in your environment variables and network whitelist.'
    });
  }
});

// Define API Router
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/employees', employeeRoutes);
apiRouter.use('/items', itemRoutes);
apiRouter.use('/accountabilities', accountabilityRoutes);
apiRouter.use('/stats', statsRoutes);
apiRouter.use('/inventory', inventoryRoutes);

// Seed API endpoint for instant initialization from UI
apiRouter.post('/seed', async (req, res) => {
  try {
    await seedDatabase();
    res.json({ message: 'Database successfully populated with Chawnah Foods Inc. sample data!' });
  } catch (err) {
    console.error('Seed API error:', err);
    res.status(500).json({ message: 'Failed to seed database', error: err.message });
  }
});

// Root API information endpoint
apiRouter.get('/', (req, res) => {
  const dbState = mongoose.connection ? mongoose.connection.readyState : 0;
  const dbStateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'online',
    database: dbStateMap[dbState] || 'unknown',
    system: 'Chawnah Foods Inc. Equipment Accountability System API',
    endpoints: {
      health: '/api/health',
      stats: '/api/stats',
      employees: '/api/employees',
      items: '/api/items',
      inventory: '/api/inventory',
      accountabilities: '/api/accountabilities',
      auth: '/api/auth'
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  const dbState = mongoose.connection ? mongoose.connection.readyState : 0;
  const dbStateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'online',
    database: dbStateMap[dbState] || 'unknown',
    system: 'Chawnah Foods Inc. Equipment Accountability System',
    timestamp: new Date().toISOString(),
  });
});

// Mount router on both '/api' and '/' to ensure compatibility whether serverless rewrites strip or retain the prefix
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Start server locally when executed directly
if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ MongoDB initial connection error:', err);
      app.listen(PORT, () => {
        console.log(`⚠️ Server running with DB warning on http://localhost:${PORT}`);
      });
    });
}

module.exports = app;
module.exports.connectDB = connectDB;

