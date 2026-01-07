const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { web3 } = require('../config/web3');
const { sendEmail } = require('../utils/emailSender');

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { walletAddress, email, name, role, profile } = req.body;

        // Validation
        if (!walletAddress || !email || !name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ walletAddress }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this wallet address or email already exists'
            });
        }

        // Validate wallet address
        if (!web3.utils.isAddress(walletAddress)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid wallet address'
            });
        }

        // Create user
        const user = await User.create({
            walletAddress: walletAddress.toLowerCase(),
            email: email.toLowerCase(),
            name,
            role: role || 'student',
            profile: profile || {}
        });

        // Generate token
        const token = generateToken(user._id);

        // Send welcome email
        if (process.env.NODE_ENV === 'production') {
            await sendEmail({
                to: email,
                subject: 'Welcome to Blockchain Scholarship System',
                template: 'welcome',
                data: { name, role: user.role }
            });
        }

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                walletAddress: user.walletAddress,
                email: user.email,
                name: user.name,
                role: user.role,
                profile: user.profile,
                isVerified: user.verification.isVerified
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { walletAddress } = req.body;

        // Validation
        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Please provide wallet address'
            });
        }

        // Validate wallet address format
        if (!web3.utils.isAddress(walletAddress)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid wallet address format'
            });
        }

        // Find user
        const user = await User.findOne({
            walletAddress: walletAddress.toLowerCase(),
            isActive: true
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                walletAddress: user.walletAddress,
                email: user.email,
                name: user.name,
                role: user.role,
                profile: user.profile,
                verification: user.verification,
                lastLogin: user.lastLogin
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('applicationCount');

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { name, email, profile } = req.body;

        const user = await User.findById(req.user.id);

        if (name) user.name = name;
        if (email) user.email = email.toLowerCase();
        if (profile) user.profile = { ...user.profile, ...profile };

        await user.save();

        res.json({
            success: true,
            user: {
                id: user._id,
                walletAddress: user.walletAddress,
                email: user.email,
                name: user.name,
                role: user.role,
                profile: user.profile
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during profile update',
            error: error.message
        });
    }
};

// @desc    Verify user (admin only)
// @route   PUT /api/auth/verify/:id
// @access  Private/Admin
const verifyUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.verification.isVerified = true;
        user.verification.verifiedBy = req.user.id;
        user.verification.verifiedAt = new Date();

        await user.save();

        // Send verification email
        if (process.env.NODE_ENV === 'production') {
            await sendEmail({
                to: user.email,
                subject: 'Account Verified',
                template: 'verification_complete',
                data: { name: user.name }
            });
        }

        res.json({
            success: true,
            message: 'User verified successfully'
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during verification',
            error: error.message
        });
    }
};

// @desc    Get all users (admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const { role, verified, page = 1, limit = 10 } = req.query;
        
        let query = { isActive: true };
        
        if (role) query.role = role;
        if (verified !== undefined) query['verification.isVerified'] = verified === 'true';

        const users = await User.find(query)
            .select('-blockchain.nonce')
            .populate('verification.verifiedBy', 'name email')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    getMe,
    updateProfile,
    verifyUser,
    getUsers
};