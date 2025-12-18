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

            // 1. Xử lý dữ liệu đầu vào
            const amountWei = ethers.parseEther(form.amount); // Đổi ETH sang Wei
            const slots = BigInt(form.slots);
            
            // Tự động set Deadline là 30 ngày kể từ hiện tại (tính bằng giây)
            const deadline = BigInt(Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60));

            // Tính tổng tiền cần nạp vào quỹ (Amount * Slots)
            const totalVal = amountWei * slots;

            // 2. Gọi Smart Contract (Phải đủ 4 tham số + overrides value)
            console.log("Đang gửi Transaction...");
            const tx = await contract.createScholarship(
                form.name,  // title
                amountWei,  // amount
                slots,      // slots
                deadline,   // deadline
                { value: totalVal } // Gửi kèm ETH
            );
            
            console.log("Hash:", tx.hash);
            await tx.wait(); // Chờ xác nhận trên blockchain
            
            // 3. Lấy ID học bổng vừa tạo để lưu vào DB
            // Vì biến nextScholarshipId tăng lên 1 sau khi tạo, nên ID vừa tạo là (next - 1)
            const nextId = await contract.nextScholarshipId();
            const currentId = Number(nextId) - 1;

            // 4. Lưu vào MongoDB (Backend API)
            await createScholarshipDB({
                blockchainId: currentId, 
                title: form.name,
                description: form.desc
            });

            alert("✅ Tạo học bổng thành công! ID: " + currentId);
            // Reset form
            setForm({ name: '', amount: '', slots: '', desc: '' });

        } catch (err) {
            console.error(err);
            // Hiển thị lỗi rõ ràng hơn
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