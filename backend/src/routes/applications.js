// File: backend/src/routes/applications.js
const express = require('express');
const router = express.Router();

// Route tạm để test (Lấy danh sách đơn ứng tuyển)
router.get('/', async (req, res) => {
    res.json({ message: "Đây là API Applications (Đang phát triển)" });
});

// QUAN TRỌNG NHẤT: Phải có dòng này để index.js nhận diện được
module.exports = router;