const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { auth, authorize } = require('../middleware/auth');
const {
    submitApplication,
    getMyApplications,
    getScholarshipApplications,
    reviewApplication,
    getApplication,
    withdrawApplication,
    getApplicationStats
} = require('../controllers/applicationController');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only images and documents are allowed'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: fileFilter
});

// Routes
router.post('/', auth, authorize('student'), upload.array('documents'), submitApplication);
router.get('/my-applications', auth, authorize('student'), getMyApplications);
router.get('/scholarship/:id', auth, authorize('provider'), getScholarshipApplications);
router.put('/:id/review', auth, authorize('provider'), reviewApplication);
router.get('/:id', auth, getApplication);
router.put('/:id/withdraw', auth, authorize('student'), withdrawApplication);
router.get('/stats', auth, authorize('admin'), getApplicationStats);

module.exports = router;