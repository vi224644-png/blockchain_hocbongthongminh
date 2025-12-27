import React, { useState } from 'react';
import { getContract } from '../services/eth';
import { createScholarshipDB } from '../services/api';
import { ethers } from 'ethers';

const AdminDashboard = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({ name: '', amount: '', slots: '', desc: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.amount || !form.slots) return alert("Vui lòng điền đủ thông tin!");

        try {
            setIsLoading(true);
            const contract = await getContract();
            if (!contract) return alert("Vui lòng kết nối ví MetaMask!");

            // 1. Xử lý dữ liệu Blockchain
            const amountWei = ethers.parseEther(form.amount); // Đổi ETH sang Wei (BigInt)
            const slots = BigInt(form.slots);
            
            // Deadline: 30 ngày tính từ hiện tại
            const deadline = BigInt(Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60));

            // Tổng tiền phải nạp
            const totalVal = amountWei * slots;

            // 2. Gọi Smart Contract
            console.log("Đang gửi Transaction...");
            const tx = await contract.createScholarship(
                form.name,  
                amountWei,  
                slots,      
                deadline,   
                { value: totalVal } 
            );
            
            console.log("Hash:", tx.hash);
            await tx.wait(); // Chờ xác nhận
            
            // 3. Lấy dữ liệu để lưu Backend
            // Lấy ID vừa tạo (nextId - 1)
            const nextId = await contract.nextScholarshipId();
            const currentId = Number(nextId) - 1;

            // Lấy địa chỉ ví người tạo (Sponsor) từ contract runner (Ethers v6)
            const sponsorAddress = await contract.runner.getAddress();

            // 4. Lưu vào MongoDB (CẬP NHẬT THEO SCHEMA MỚI)
            await createScholarshipDB({
                contractId: currentId,          // Sửa từ blockchainId -> contractId
                title: form.name,
                description: form.desc,
                sponsor: sponsorAddress,        // Thêm trường sponsor
                amount: amountWei.toString(),   // Lưu Amount dưới dạng String
                active: true                    // Mặc định là true
            });

            alert(`✅ Tạo học bổng thành công! ID: ${currentId}`);
            
            // Reset form
            setForm({ name: '', amount: '', slots: '', desc: '' });

        } catch (err) {
            console.error(err);
            alert("❌ Lỗi: " + (err.reason || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-16">
            <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
                
                <h2 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
                    <span className="text-indigo-600">⚙️ Admin Panel</span>  
                    <span className="text-gray-700 font-light">/ Tạo Học Bổng</span>
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Tên học bổng
                        </label>
                        <input
                            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                            placeholder="VD: Học bổng Khuyến Học 2024"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                        />
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Số tiền mỗi suất (ETH)
                        </label>
                        <input
                            type="number" step="0.0001"
                            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                            placeholder="VD: 0.1"
                            value={form.amount}
                            onChange={e => setForm({ ...form, amount: e.target.value })}
                        />
                    </div>

                    {/* Slots */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Số lượng suất
                        </label>
                        <input
                            type="number"
                            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                            placeholder="VD: 5"
                            value={form.slots}
                            onChange={e => setForm({ ...form, slots: e.target.value })}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Mô tả chi tiết
                        </label>
                        <textarea
                            className="w-full border border-gray-300 rounded-xl p-3 h-28 focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                            placeholder="Điều kiện, đối tượng hưởng..."
                            value={form.desc}
                            onChange={e => setForm({ ...form, desc: e.target.value })}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`
                            w-full py-3 rounded-xl text-white font-bold text-lg 
                            shadow-md transition-all duration-300
                            ${isLoading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 hover:shadow-xl'}
                        `}
                    >
                        {isLoading ? 'Đang xử lý...' : 'Tạo Học Bổng (Gửi ETH)'}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default AdminDashboard;