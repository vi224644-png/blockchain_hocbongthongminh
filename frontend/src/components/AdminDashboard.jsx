import React, { useState } from 'react';
import { getManagerContract, getTokenContract, MANAGER_ADDRESS } from '../services/eth';
import { ethers } from 'ethers';

const AdminDashboard = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [form, setForm] = useState({ name: '', amount: '', slots: '', desc: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.amount || !form.slots) return alert("Nhập đủ thông tin!");

        try {
            setIsLoading(true);
            setStatus("Đang kết nối ví...");

            const manager = await getManagerContract();
            const token = await getTokenContract();
            if (!manager || !token) return alert("Chưa kết nối ví!");

            // 1. Tính toán số tiền WCT cần chuyển (đổi sang Wei)
            const decimals = await token.decimals();
            const amountWei = ethers.parseUnits(form.amount, decimals);
            const totalWei = amountWei * BigInt(form.slots);

            // 2. APPROVE (Cấp quyền cho Contract tiêu WCT của bạn)
            setStatus("B1: Vui lòng xác nhận Approve trên ví...");
            const txApprove = await token.approve(MANAGER_ADDRESS, totalWei);
            setStatus("Đang chờ xác nhận Approve...");
            await txApprove.wait();

            // 3. CREATE (Tạo học bổng và chuyển WCT vào quỹ)
            setStatus("B2: Vui lòng xác nhận Tạo Học Bổng...");
            const deadline = BigInt(Math.floor(Date.now() / 1000) + (30 * 86400)); // Hạn 30 ngày
            
            const txCreate = await manager.createScholarship(
                form.name,
                amountWei,
                BigInt(form.slots),
                deadline
            );

            setStatus("Đang ghi vào Blockchain...");
            await txCreate.wait();

            alert("✅ Tạo học bổng thành công! Quỹ đã được nạp WCT.");
            setForm({ name: '', amount: '', slots: '', desc: '' });

        } catch (err) {
            console.error(err);
            alert("Lỗi: " + (err.reason || err.message));
        } finally {
            setIsLoading(false);
            setStatus("");
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-md border border-indigo-100">
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">Tạo Học Bổng (WCT Coin)</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input 
                    className="w-full border p-3 rounded-lg focus:ring-2 ring-indigo-300" 
                    placeholder="Tên học bổng" 
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})} 
                />
                <div className="flex gap-4">
                    <input 
                        type="number" className="w-1/2 border p-3 rounded-lg" placeholder="Số WCT/Suất (VD: 1000)" 
                        value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} 
                    />
                    <input 
                        type="number" className="w-1/2 border p-3 rounded-lg" placeholder="Số lượng suất" 
                        value={form.slots} onChange={e => setForm({...form, slots: e.target.value})} 
                    />
                </div>
                <textarea 
                    className="w-full border p-3 rounded-lg h-24" placeholder="Mô tả chi tiết..."
                    value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} 
                />
                <button 
                    disabled={isLoading}
                    className={`w-full py-3 text-white font-bold rounded-lg transition ${isLoading ? 'bg-gray-400' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg'}`}
                >
                    {isLoading ? status : "Tạo & Nạp Quỹ WCT"}
                </button>
            </form>
        </div>
    );
};

export default AdminDashboard;