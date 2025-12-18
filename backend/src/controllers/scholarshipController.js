const Scholarship = require('../models/Scholarship');
const { getContract } = require('../utils/ethereum');

exports.createLocal = async (req,res) => {
    // Tạo cả trên contract (việc gọi) và lưu vào DB
    const { title, description, amount } = req.body;
    // gọi contract
    const contract = getContract(process.env.INFURA_RPC, process.env.CONTRACT_ADDRESS, process.env.PRIVATE_KEY);
    const tx = await contract.createScholarship(title, description, amount);
    await tx.wait();
    // giả sử contract tăng id theo thứ tự: getAllIds không cần dùng; ta có thể đọc scholarshipCount hoặc sự kiện
    // Lưu tạm vào DB (không có contractId chính xác nếu ko đọc event) -- demo đơn giản
    const s = await Scholarship.create({ title, description, amount, creator: req.userId });
    res.json(s);
};

exports.list = async (req,res) => {
    const items = await Scholarship.find();
    res.json(items);
};