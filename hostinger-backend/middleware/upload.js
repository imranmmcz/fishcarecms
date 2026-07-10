const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Storage configuration for product images
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'products');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

// Storage configuration for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'avatars');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  }
});

// General storage for other uploads (hero slides, etc.)
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'general');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `file-${uniqueSuffix}${ext}`);
  }
});

// File filter - only allow images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('শুধুমাত্র ইমেজ ফাইল (JPEG, PNG, GIF, WebP, SVG) অনুমোদিত!'), false);
  }
};

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB

const uploadProductImage = multer({
  storage: productStorage,
  fileFilter: imageFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB for avatars
});

const uploadGeneral = multer({
  storage: generalStorage,
  fileFilter: imageFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

// ---- Generic bucket storage (Supabase-Storage compatible) ----
const PUBLIC_BUCKETS = new Set(['avatars', 'product-images', 'blog-images', 'products', 'general']);
const PRIVATE_BUCKETS = new Set(['partner-documents']);

const bucketRoot = (bucket) => {
  if (PUBLIC_BUCKETS.has(bucket)) return path.join(__dirname, '..', 'uploads', bucket);
  if (PRIVATE_BUCKETS.has(bucket)) return path.join(__dirname, '..', 'uploads', 'private', bucket);
  return null;
};

const bucketStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const bucket = req.params.bucket;
    const root = bucketRoot(bucket);
    if (!root) return cb(new Error('Unknown bucket: ' + bucket));
    const subPath = (req.params[0] || '').replace(/\.\.+/g, '').replace(/^\/+/, '');
    const dir = subPath ? path.join(root, path.dirname(subPath)) : root;
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const subPath = (req.params[0] || '').replace(/\.\.+/g, '').replace(/^\/+/, '');
    if (subPath) return cb(null, path.basename(subPath));
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `file-${uniqueSuffix}${ext}`);
  }
});

const anyFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mt = /image\/|application\/pdf|application\/msword|application\/vnd\.openxml/.test(file.mimetype);
  if (ext && mt) return cb(null, true);
  cb(new Error('অননুমোদিত ফাইল টাইপ'), false);
};

const uploadBucket = multer({
  storage: bucketStorage,
  fileFilter: anyFileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

module.exports = {
  uploadProductImage,
  uploadAvatar,
  uploadGeneral,
  uploadBucket,
  PUBLIC_BUCKETS,
  PRIVATE_BUCKETS,
  bucketRoot,
};
