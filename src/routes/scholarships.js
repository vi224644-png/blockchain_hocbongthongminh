const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
    createScholarship,
    getScholarships,
    getScholarship,
    updateScholarship,
    deleteScholarship,
    getProviderScholarships,
    getScholarshipStats
} = require('../controllers/scholarshipController');

// Public routes
router.get('/', getScholarships);
router.get('/stats', getScholarshipStats);
router.get('/:id', getScholarship);

// Protected routes
router.post('/', auth, authorize('provider'), createScholarship);
router.put('/:id', auth, authorize('provider'), updateScholarship);
router.delete('/:id', auth, authorize('provider'), deleteScholarship);
router.get('/provider/me', auth, authorize('provider'), getProviderScholarships);

module.exports = router;