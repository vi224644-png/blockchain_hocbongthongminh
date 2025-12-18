const mongoose = require('mongoose');
const ApplicationSchema = new mongoose.Schema({
    scholarshipId: Number,
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    applicantWallet: String,
    metadataURI: String,
    approved: { type: Boolean, default: false },
    paid: { type: Boolean, default: false },
}, { timestamps: true });
module.exports = mongoose.model('Application', ApplicationSchema);