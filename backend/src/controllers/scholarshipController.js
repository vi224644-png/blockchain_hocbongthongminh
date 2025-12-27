const Scholarship = require('../models/Scholarship');
const { ethers } = require('ethers');
// Giả sử file utils/ethereum.js của bạn export hàm lấy contract có Signer (ví Admin)
const { getContract } = require('../utils/ethereum'); 

exports.createLocal = async (req, res) => {
    try {
        // 1. Nhận dữ liệu từ API (Frontend hoặc Postman gửi lên)
        const { title, description, amount, slots } = req.body;

        if (!title || !amount || !slots) {
            return res.status(400).json({ message: "Thiếu thông tin: title, amount, slots" });
        }

        // 2. Cấu hình tính toán cho Blockchain
        const amountWei = ethers.parseEther(amount.toString()); // Đổi "0.1" -> BigInt Wei
        const slotsBigInt = BigInt(slots);
        
        // Tự động tính Deadline (ví dụ 30 ngày)
        const deadline = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
        
        // Tính tổng tiền Admin cần nạp vào quỹ (Amount * Slots)
        const totalFund = amountWei * slotsBigInt;

        // 3. Khởi tạo Contract với ví Admin (Private Key từ .env)
        // Lưu ý: Hàm getContract phải trả về contract có kết nối với Wallet (Signer)
        const contract = getContract(); 
        
        // Lấy địa chỉ ví Admin để lưu vào DB làm 'sponsor'
        const adminWallet = await contract.runner.getAddress();

        console.log(`⏳ Đang tạo học bổng trên Blockchain từ ví: ${adminWallet}...`);

        // 4. GỌI SMART CONTRACT (Quan trọng: Phải truyền value)
        const tx = await contract.createScholarship(
            title,
            amountWei,
            slotsBigInt,
            deadline,
            { value: totalFund } // Gửi ETH kèm transaction
        );

        // 5. Chờ Transaction được xác nhận và ĐỌC LOGS
        const receipt = await tx.wait();

        // --- KỸ THUẬT LẤY ID TỪ EVENT LOGS (Ethers v6) ---
        // Tìm sự kiện "ScholarshipCreated" trong danh sách logs
        const event = receipt.logs.find(log => {
            // Chỉ kiểm tra log thuộc về contract của mình và có thể parse được
            try {
                const parsed = contract.interface.parseLog(log);
                return parsed.name === 'ScholarshipCreated';
            } catch (e) { return false; }
        });

        let newScholarshipId = null;
        if (event) {
            const parsedLog = contract.interface.parseLog(event);
            // Tham số đầu tiên của sự kiện là 'id'
            newScholarshipId = Number(parsedLog.args[0]); 
        } else {
            // Fallback: Nếu không tìm thấy event (hiếm), lấy nextId thủ công
            const nextId = await contract.nextScholarshipId();
            newScholarshipId = Number(nextId) - 1;
        }

        console.log(`✅ Blockchain xác nhận thành công. ID: ${newScholarshipId}`);

        // 6. Lưu vào MongoDB (Khớp với Schema bạn cung cấp)
        const newScholarshipDB = await Scholarship.create({
            contractId: newScholarshipId,    // ID chính xác từ Blockchain
            title: title,
            description: description,
            sponsor: adminWallet,            // Địa chỉ ví Admin
            amount: amountWei.toString(),    // Lưu Wei dạng string
            slots: Number(slots),
            active: true
        });

        res.status(201).json({
            message: "Tạo học bổng thành công cả trên Chain và DB",
            data: newScholarshipDB,
            txHash: tx.hash
        });

    } catch (error) {
        console.error("❌ Lỗi createLocal:", error);
        // Kiểm tra lỗi revert từ contract
        const reason = error.reason || error.message;
        res.status(500).json({ message: "Lỗi tạo học bổng", error: reason });
    }
};

exports.list = async (req, res) => {
    try {
        // Chỉ lấy các học bổng đang active
        const items = await Scholarship.find({ active: true }).sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};