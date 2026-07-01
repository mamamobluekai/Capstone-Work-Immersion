const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticate = require('../middlewares/verifyToken');
const authorize = require('../middlewares/authorizeRole');
const {
  upsertRequirements,
  submitRequirements,
  getRequirements,
  uploadDocument,
  deleteDocument,
  listSubmissions,
  reviewSubmission,
  verifyDocument,
} = require('../controllers/requirements.controller');

const router = Router();
const uploadDir = path.join(__dirname, '..', 'uploads', 'requirements');
fs.mkdirSync(uploadDir, { recursive: true });

const allowedExtensions = new Set(['.pdf', '.docx', '.jpg', '.jpeg', '.png']);
const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user.id}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.has(ext) || !allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error('Only PDF, DOCX, JPG, and PNG files up to 10MB are allowed.'));
    }
    cb(null, true);
  },
});

router.get('/requirements/submissions', authenticate, authorize('coordinator', 'admin'), listSubmissions);
router.get('/requirements/:studentId', authenticate, authorize('student', 'coordinator', 'admin'), getRequirements);
router.get('/progress/:studentId', authenticate, authorize('student', 'coordinator', 'admin'), getRequirements);
router.put('/requirements', authenticate, authorize('student'), upsertRequirements);
router.post('/requirements', authenticate, authorize('student'), submitRequirements);
router.post('/upload', authenticate, authorize('student'), upload.single('file'), uploadDocument);
router.delete('/requirements/document/:id', authenticate, authorize('student', 'coordinator', 'admin'), deleteDocument);
router.patch('/requirements/submissions/:id/review', authenticate, authorize('coordinator', 'admin'), reviewSubmission);
router.patch('/requirements/document/:id/verify', authenticate, authorize('coordinator', 'admin'), verifyDocument);

router.use((err, _req, res, next) => {
  if (!err) return next();
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File must be 10MB or smaller.' });
  }
  return res.status(400).json({ error: err.message || 'Upload failed.' });
});

module.exports = router;
