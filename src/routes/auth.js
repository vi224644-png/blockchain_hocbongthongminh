const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
    register,
    login,
    getMe,
    updateProfile,
    verifyUser,
    getUsers
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);

// Admin routes
router.put('/verify/:id', auth, authorize('admin'), verifyUser);
router.get('/users', auth, authorize('admin'), getUsers);

module.exports = router;