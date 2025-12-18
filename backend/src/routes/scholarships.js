const express = require('express');
const router = express.Router();
const Scholarship = require('../models/Scholarship');
const { createScholarshipOnChain } = require('../utils/ethereum');

// create scholarship (calls smart contract createScholarship with value)
router.post('/', async (req, res) => {
    try {
        const { title, description, sponsorWallet, value } = req.body;
        // 1. call smart contract via ethers.js
        const tx = await createScholarshipOnChain(title, description, value, sponsorWallet);
        // tx should return contract events including scholarshipId or receipt
        // 2. store metadata in Mongo
        const s = new Scholarship({
        contractId: tx.scholarshipId || 0,
        title, description, sponsor: sponsorWallet, amount: value, active: true
        });
        await s.save();
        res.json({ ok: true, s, tx });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;