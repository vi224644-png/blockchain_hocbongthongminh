const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// simple email/password register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, wallet } = req.body;
        const hashed = await bcrypt.hash(password, 10);
        const u = new User({ name, email, password: hashed, role, wallet });
        await u.save();
        res.json({ ok: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const u = await User.findOne({ email });
        if (!u) return res.status(400).json({ error: 'invalid credentials' });
        const match = await bcrypt.compare(password, u.password);
        if (!match) return res.status(400).json({ error: 'invalid credentials' });
        const token = jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;