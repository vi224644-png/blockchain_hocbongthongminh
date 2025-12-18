const mongoose = require('mongoose');
const ScholarshipSchema = new mongoose.Schema({
    contractId: Number,
    title: String,
    description: String,
    sponsor: String, // wallet
    amount: String, // wei as string
    active: Boolean,
}, { timestamps: true });
module.exports = mongoose.model('Scholarship', ScholarshipSchema);