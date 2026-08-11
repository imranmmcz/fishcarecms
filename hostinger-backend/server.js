require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const { initDatabase } = require('./config/initDatabase');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const marketPriceRoutes = require('./routes/marketPrices');
const settingsRoutes = require('./routes/settings');
const adSettingsRoutes = require('./routes/adSettings');
const pageContentRoutes = require('./routes/pageContent');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const blogRoutes = require('./routes/blog');
const farmingRoutes = require('./routes/farming');
const extrasRoutes = require('./routes/extras');
const uploadRoutes = require('./routes/uploads');
const customerRoutes = require('./routes/customers');
const posRoutes = require('./routes/pos');
const catalogRoutes = require('./routes/catalog');
const stockRoutes = require('./routes/stock');
const purchaseRoutes = require('./routes/purchases');
const healthRoutes = require('./routes/health');
const migrationRoutes = require('./routes/migration');
const { metricsMiddleware } = require('./middleware/metrics');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
['products', 'product-images', 'avatars', 'general', 'blog-images', 'private/partner-documents'].forEach(dir => {
  const fullPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'অনেক বেশি রিকোয়েস্ট পাঠানো হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন।' }
});
app.use(limiter);

// === STRICT CORS Configuration ===
const allowedOrigins = [
  'https://fishcal.lovable.app',
  'https://fishcare.lovable.app',
  'https://fishcare.com.bd',
  'https://www.fishcare.com.bd',
  'https://blog.fishcare.com.bd',
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [])
].filter(Boolean);

// Add localhost only in development
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000');
}

// Remove duplicates
const uniqueOrigins = [...new Set(allowedOrigins)];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const isAllowed = uniqueOrigins.includes(origin) || 
      origin.includes('.lovableproject.com') ||
      origin.includes('.lovable.app');
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS BLOCKED] Origin: ${origin} at ${new Date().toISOString()}`);
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.options('*', cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request metrics + X-Request-Id (must come after body parser, before routes)
app.use(metricsMiddleware);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/market-prices', marketPriceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ad-settings', adSettingsRoutes);
app.use('/api/page-content', pageContentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/pos', posRoutes);
app.use('/api', catalogRoutes);
app.use('/api', stockRoutes);
app.use('/api', purchaseRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/farming', farmingRoutes);
app.use('/api', extrasRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/migration', migrationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Structured error middleware (must be after routes)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

(async () => {
  try {
    // Auto-create database + apply every schema file in database/ on boot.
    // Safe on re-runs (uses CREATE TABLE IF NOT EXISTS / INSERT IGNORE).
    await initDatabase();
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      console.error('🛑 Refusing to start API server — database init failed.');
      process.exit(1);
    } else {
      console.warn('⚠️  Starting API server despite database init errors (dev mode).');
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 FishCare API Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Allowed Origins: ${uniqueOrigins.join(', ')}`);
  });
})();
