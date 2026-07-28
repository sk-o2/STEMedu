const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { protect, authorize } = require('../middleware/auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for raw files (PDFs, PPTs, PPTX)
const rawStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    return {
      folder: 'stemedu_materials',
      resource_type: 'raw',
      public_id: `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`,
      format: ext,
    };
  },
});

// Storage for images (thumbnails, avatars)
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'stemedu_images',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

const uploadRaw = multer({
  storage: rawStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF and PowerPoint files are allowed'), false);
  },
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

// @route POST /api/upload/file
// @desc  Upload PDF or PPT to Cloudinary
// @access Private (admin, tutor)
router.post('/file', protect, authorize('admin', 'tutor'), uploadRaw.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });
  res.status(200).json({
    success: true,
    url: req.file.path,
    publicId: req.file.filename,
    originalName: req.file.originalname,
    message: 'File uploaded successfully',
  });
});

// @route POST /api/upload/image
// @desc  Upload image to Cloudinary
// @access Private (admin, tutor)
router.post('/image', protect, authorize('admin', 'tutor'), uploadImage.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No image provided' });
  res.status(200).json({
    success: true,
    url: req.file.path,
    publicId: req.file.filename,
    message: 'Image uploaded successfully',
  });
});

// Legacy route kept for backwards compatibility
router.post('/', protect, authorize('admin', 'tutor'), uploadRaw.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a file' });
  res.status(200).json({ success: true, url: req.file.path, message: 'File uploaded successfully' });
});

module.exports = router;
