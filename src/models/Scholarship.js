const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    required: {
        type: Boolean,
        default: true
    },
    allowedTypes: [{
        type: String,
        enum: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
    }],
    maxSize: {
        type: Number,
        default: 5 * 1024 * 1024 // 5MB
    }
});

const criteriaSchema = new mongoose.Schema({
    minGPA: {
        type: Number,
        min: 0,
        max: 4,
        default: 0
    },
    requiredMajor: [String],
    yearRequirement: {
        type: String,
        enum: ['1', '2', '3', '4', '5', 'any'],
        default: 'any'
    },
    ageRange: {
        min: Number,
        max: Number
    },
    otherRequirements: [String],
    financialNeed: {
        type: Boolean,
        default: false
    },
    extracurricular: {
        type: Boolean,
        default: false
    }
});

const scholarshipSchema = new mongoose.Schema({
    blockchainId: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'VND',
        enum: ['VND', 'USD', 'ETH']
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    criteria: criteriaSchema,
    documents: [documentSchema],
    deadline: {
        type: Date,
        required: true,
        index: true
    },
    maxRecipients: {
        type: Number,
        required: true,
        min: 1
    },
    currentRecipients: {
        type: Number,
        default: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['academic', 'financial', 'merit', 'research', 'sports', 'arts', 'other'],
        index: true
    },
    tags: [String],
    requirements: {
        minGPA: Number,
        requiredCourses: [String],
        languageProficiency: {
            english: {
                type: String,
                enum: ['none', 'basic', 'intermediate', 'advanced']
            },
            other: String
        }
    },
    selectionProcess: {
        type: String,
        enum: ['auto', 'manual', 'hybrid'],
        default: 'hybrid'
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'closed', 'cancelled'],
        default: 'active',
        index: true
    },
    statistics: {
        totalApplications: {
            type: Number,
            default: 0
        },
        pendingApplications: {
            type: Number,
            default: 0
        },
        approvedApplications: {
            type: Number,
            default: 0
        },
        rejectedApplications: {
            type: Number,
            default: 0
        },
        averageScore: {
            type: Number,
            default: 0
        }
    },
    blockchain: {
        transactionHash: String,
        blockNumber: Number,
        contractAddress: String,
        gasUsed: Number
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    notificationSent: {
        deadlineReminder: {
            type: Boolean,
            default: false
        },
        resultsPublished: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals
scholarshipSchema.virtual('applicationCount', {
    ref: 'Application',
    localField: '_id',
    foreignField: 'scholarship',
    count: true
});

scholarshipSchema.virtual('daysRemaining').get(function() {
    const now = new Date();
    const deadline = new Date(this.deadline);
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
});

scholarshipSchema.virtual('isExpired').get(function() {
    return new Date() > new Date(this.deadline);
});

// Indexes
scholarshipSchema.index({ provider: 1, status: 1 });
scholarshipSchema.index({ deadline: 1, status: 1 });
scholarshipSchema.index({ category: 1, isActive: 1 });
scholarshipSchema.index({ 'criteria.minGPA': 1 });

// Methods
scholarshipSchema.methods.canApply = function(student) {
    if (this.status !== 'active') return false;
    if (this.isExpired) return false;
    if (this.currentRecipients >= this.maxRecipients) return false;
    
    // Check GPA requirement
    if (student.profile.gpa < this.criteria.minGPA) return false;
    
    // Check year requirement
    if (this.criteria.yearRequirement !== 'any' && 
        student.profile.year !== parseInt(this.criteria.yearRequirement)) return false;
    
    return true;
};

scholarshipSchema.methods.updateStatistics = async function() {
    const Application = mongoose.model('Application');
    const stats = await Application.aggregate([
        { $match: { scholarship: this._id } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
                rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
                avgScore: { $avg: '$score' }
            }
        }
    ]);
    
    if (stats.length > 0) {
        this.statistics.totalApplications = stats[0].total;
        this.statistics.pendingApplications = stats[0].pending;
        this.statistics.approvedApplications = stats[0].approved;
        this.statistics.rejectedApplications = stats[0].rejected;
        this.statistics.averageScore = stats[0].avgScore || 0;
    }
    
    return this.save();
};

module.exports = mongoose.model('Scholarship', scholarshipSchema);