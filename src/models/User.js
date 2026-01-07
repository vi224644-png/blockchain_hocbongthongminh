const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['student', 'provider', 'verifier', 'admin'],
        default: 'student',
        index: true
    },
    profile: {
        university: String,
        major: String,
        gpa: {
            type: Number,
            min: 0,
            max: 4
        },
        year: {
            type: Number,
            min: 1,
            max: 5
        },
        phone: String,
        address: String,
        dateOfBirth: Date,
        studentId: String
    },
    verification: {
        isVerified: {
            type: Boolean,
            default: false
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        verifiedAt: Date,
        documents: [{
            type: String,
            hash: String,
            verified: Boolean
        }]
    },
    blockchain: {
        nonce: {
            type: String,
            default: () => Math.floor(Math.random() * 1000000).toString()
        },
        lastActivity: Date,
        transactionCount: {
            type: Number,
            default: 0
        }
    },
    notifications: {
        email: {
            type: Boolean,
            default: true
        },
        blockchain: {
            type: Boolean,
            default: true
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1, walletAddress: 1 });
userSchema.index({ role: 1, isActive: 1 });

// Virtual for application count
userSchema.virtual('applicationCount', {
    ref: 'Application',
    localField: '_id',
    foreignField: 'student',
    count: true
});

// Methods
userSchema.methods.generateNonce = function() {
    this.blockchain.nonce = Math.floor(Math.random() * 1000000).toString();
    return this.blockchain.nonce;
};

userSchema.methods.updateLastActivity = function() {
    this.blockchain.lastActivity = new Date();
    this.blockchain.transactionCount += 1;
    return this.save();
};

module.exports = mongoose.model('User', userSchema);