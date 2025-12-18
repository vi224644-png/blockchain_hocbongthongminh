const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ['student','admin','sponsor'], default: 'student' },
    wallet: { type: String }, // address
}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);