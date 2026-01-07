const Scholarship = require('../models/Scholarship');
const User = require('../models/User');
const { contract, web3 } = require('../config/web3');
const { uploadToIPFS } = require('../utils/ipfsUploader');

// @desc    Create scholarship
// @route   POST /api/scholarships
// @access  Private/Provider
const createScholarship = async (req, res) => {
    try {
        const {
            name,
            description,
            amount,
            criteria,
            documents,
            deadline,
            maxRecipients,
            category,
            requiredDocuments
        } = req.body;

        // Validation
        if (!name || !description || !amount || !deadline || !maxRecipients) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Validate deadline
        if (new Date(deadline) <= new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Deadline must be in the future'
            });
        }

        // Get provider's wallet from user profile
        const provider = await User.findById(req.user.id);
        if (!provider || provider.role !== 'provider') {
            return res.status(403).json({
                success: false,
                message: 'Only providers can create scholarships'
            });
        }

        // Create scholarship on blockchain
        const accounts = await web3.eth.getAccounts();
        const scholarshipFund = web3.utils.toWei((amount * maxRecipients).toString(), 'ether');
        
        const tx = await contract.methods
            .createScholarship(
                name,
                description,
                web3.utils.toWei(amount.toString(), 'ether'),
                JSON.stringify(criteria),
                Math.floor(new Date(deadline).getTime() / 1000),
                maxRecipients,
                category,
                requiredDocuments || []
            )
            .send({ 
                from: provider.walletAddress,
                value: scholarshipFund,
                gas: 3000000
            });

        const blockchainId = tx.events.ScholarshipCreated.returnValues.id;

        // Create scholarship in database
        const scholarship = await Scholarship.create({
            blockchainId: blockchainId.toString(),
            name,
            description,
            amount,
            provider: req.user.id,
            criteria: criteria || {},
            documents: documents || [],
            deadline,
            maxRecipients,
            category,
            requiredDocuments: requiredDocuments || [],
            blockchain: {
                transactionHash: tx.transactionHash,
                blockNumber: tx.blockNumber,
                contractAddress: tx.to,
                gasUsed: tx.gasUsed
            }
        });

        res.status(201).json({
            success: true,
            message: 'Scholarship created successfully',
            scholarship
        });

    } catch (error) {
        console.error('Create scholarship error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating scholarship',
            error: error.message
        });
    }
};

// @desc    Get all scholarships
// @route   GET /api/scholarships
// @access  Public
const getScholarships = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            category,
            status,
            minAmount,
            maxAmount,
            deadline,
            sort = '-createdAt'
        } = req.query;

        let query = { isActive: true };
        
        // Filters
        if (category) query.category = category;
        if (status) query.status = status;
        if (minAmount) query.amount = { $gte: minAmount };
        if (maxAmount) query.amount = { ...query.amount, $lte: maxAmount };
        if (deadline) query.deadline = { $gte: new Date(deadline) };

        const scholarships = await Scholarship.find(query)
            .populate('provider', 'name email verification.isVerified')
            .populate('applicationCount')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Scholarship.countDocuments(query);

        res.json({
            success: true,
            scholarships,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('Get scholarships error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching scholarships',
            error: error.message
        });
    }
};

// @desc    Get single scholarship
// @route   GET /api/scholarships/:id
// @access  Public
const getScholarship = async (req, res) => {
    try {
        const scholarship = await Scholarship.findById(req.params.id)
            .populate('provider', 'name email verification.isVerified profile')
            .populate({
                path: 'applicationCount',
                match: { isActive: true }
            });

        if (!scholarship) {
            return res.status(404).json({
                success: false,
                message: 'Scholarship not found'
            });
        }

        // Get blockchain data
        const blockchainData = await contract.methods.scholarships(scholarship.blockchainId).call();
        
        res.json({
            success: true,
            scholarship: {
                ...scholarship.toObject(),
                blockchainData
            }
        });

    } catch (error) {
        console.error('Get scholarship error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching scholarship',
            error: error.message
        });
    }
};

// @desc    Update scholarship
// @route   PUT /api/scholarships/:id
// @access  Private/Provider
const updateScholarship = async (req, res) => {
    try {
        const scholarship = await Scholarship.findById(req.params.id);

        if (!scholarship) {
            return res.status(404).json({
                success: false,
                message: 'Scholarship not found'
            });
        }

        // Check ownership
        if (scholarship.provider.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this scholarship'
            });
        }

        // Update fields
        const allowedUpdates = ['name', 'description', 'criteria', 'documents', 'category', 'tags'];
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                scholarship[key] = req.body[key];
            }
        });

        await scholarship.save();

        res.json({
            success: true,
            message: 'Scholarship updated successfully',
            scholarship
        });

    } catch (error) {
        console.error('Update scholarship error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating scholarship',
            error: error.message
        });
    }
};

// @desc    Delete scholarship
// @route   DELETE /api/scholarships/:id
// @access  Private/Provider
const deleteScholarship = async (req, res) => {
    try {
        const scholarship = await Scholarship.findById(req.params.id);

        if (!scholarship) {
            return res.status(404).json({
                success: false,
                message: 'Scholarship not found'
            });
        }

        // Check ownership
        if (scholarship.provider.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this scholarship'
            });
        }

        // Deactivate on blockchain
        const accounts = await web3.eth.getAccounts();
        await contract.methods
            .deactivateScholarship(scholarship.blockchainId)
            .send({ from: accounts[0], gas: 3000000 });

        // Soft delete
        scholarship.isActive = false;
        scholarship.status = 'cancelled';
        await scholarship.save();

        res.json({
            success: true,
            message: 'Scholarship deleted successfully'
        });

    } catch (error) {
        console.error('Delete scholarship error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting scholarship',
            error: error.message
        });
    }
};

// @desc    Get provider scholarships
// @route   GET /api/scholarships/provider/me
// @access  Private/Provider
const getProviderScholarships = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        let query = { provider: req.user.id };
        if (status) query.status = status;

        const scholarships = await Scholarship.find(query)
            .populate('applicationCount')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Scholarship.countDocuments(query);

        res.json({
            success: true,
            scholarships,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('Get provider scholarships error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching provider scholarships',
            error: error.message
        });
    }
};

// @desc    Get scholarship statistics
// @route   GET /api/scholarships/stats
// @access  Public
const getScholarshipStats = async (req, res) => {
    try {
        const stats = await Scholarship.aggregate([
            {
                $group: {
                    _id: null,
                    totalScholarships: { $sum: 1 },
                    activeScholarships: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    totalAmount: { $sum: '$amount' },
                    averageAmount: { $avg: '$amount' },
                    totalRecipients: { $sum: '$currentRecipients' }
                }
            }
        ]);

        const categoryStats = await Scholarship.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        res.json({
            success: true,
            stats: stats[0] || {},
            categoryStats
        });

    } catch (error) {
        console.error('Get scholarship stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching scholarship statistics',
            error: error.message
        });
    }
};

module.exports = {
    createScholarship,
    getScholarships,
    getScholarship,
    updateScholarship,
    deleteScholarship,
    getProviderScholarships,
    getScholarshipStats
};