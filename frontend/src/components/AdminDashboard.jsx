import React, { useState } from 'react';
import { getManagerContract, getTokenContract, MANAGER_ADDRESS } from '../services/eth';
import { ethers } from 'ethers';

const AdminDashboard = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [form, setForm] = useState({ 
        name: '', 
        amount: '', 
        slots: '', 
        desc: '',
        deadlineDate: '' 
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.amount || !form.slots || !form.deadlineDate) return alert("Vui lòng nhập đủ thông tin!");

        try {
            setIsLoading(true);
            
            // Lấy 23:59:59 của ngày được chọn làm hạn chót
            const dateObj = new Date(form.deadlineDate);
            dateObj.setHours(23, 59, 59, 999); 
            const deadlineTimestamp = Math.floor(dateObj.getTime() / 1000);

            // Kiểm tra nếu ngày chọn < hiện tại
            if (deadlineTimestamp < Math.floor(Date.now() / 1000)) {
                return alert("Ngày hết hạn phải ở tương lai!");
            }

            const manager = await getManagerContract();
            const token = await getTokenContract();
            if (!manager || !token) return alert("Chưa kết nối ví!");

            // 1. Tính toán
            const decimals = await token.decimals();
            const amountWei = ethers.parseUnits(form.amount, decimals);
            const totalWei = amountWei * BigInt(form.slots);

            // 2. Approve
            setStatus("⏳ B1: Đang xác nhận quyền chuyển Token...");
            const txApprove = await token.approve(MANAGER_ADDRESS, totalWei);
            await txApprove.wait();

            // 3. Create
            setStatus("⏳ B2: Đang tạo học bổng trên Blockchain...");
            const txCreate = await manager.createScholarship(
                form.name,
                amountWei,
                BigInt(form.slots),
                BigInt(deadlineTimestamp)
            );
            await txCreate.wait();

            alert("✅ Đã tạo học bổng thành công!");
            setForm({ name: '', amount: '', slots: '', desc: '', deadlineDate: '' });

        } catch (err) {
            console.error(err);
            alert("Lỗi: " + (err.reason || err.message));
        } finally {
            setIsLoading(false);
            setStatus("");
        }
    };

    // Lấy ngày hôm nay định dạng YYYY-MM-DD để làm giá trị min cho input date
    const today = new Date().toISOString().split("T")[0];

    return (
        <div className="p-8 bg-white rounded-2xl shadow-xl border border-indigo-50">
            <h2 className="text-3xl font-bold mb-6 text-indigo-800 flex items-center gap-3">
                <span className="bg-indigo-100 p-2 rounded-lg text-2xl">🎓</span>
                Quản Lý Học Bổng
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tên học bổng */}
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Tên chương trình học bổng</label>
                    <input 
                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" 
                        placeholder="VD: Học bổng Thắp Sáng Ước Mơ 2024" 
                        value={form.name} onChange={e => setForm({...form, name: e.target.value})} 
                    />
                </div>
                
                {/* Grid 3 cột: Số tiền - Số lượng - Hạn chót */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Giá trị (WCT/Suất)</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none pr-12 font-medium" 
                                placeholder="1000" 
                                value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} 
                            />
                            <span className="absolute right-3 top-3 text-gray-400 text-sm font-bold">WCT</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Số lượng suất</label>
                        <input 
                            type="number" 
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                            placeholder="VD: 5"
                            value={form.slots} onChange={e => setForm({...form, slots: e.target.value})} 
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-red-600 mb-2">📅 Hạn chót nộp hồ sơ</label>
                        <input 
                            type="date" 
                            min={today} // Chặn chọn ngày quá khứ
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 font-medium cursor-pointer"
                            value={form.deadlineDate} onChange={e => setForm({...form, deadlineDate: e.target.value})} 
                        />
                    </div>
                </div>

                {/* Mô tả */}
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Mô tả chi tiết & Yêu cầu</label>
                    <textarea 
                        className="w-full border border-gray-300 p-3 rounded-lg h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                        placeholder="Nhập điều kiện nhận học bổng, đối tượng ưu tiên, v.v..."
                        value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} 
                    />
                </div>

                {/* Nút Submit */}
                <button 
                    disabled={isLoading}
                    className={`w-full py-4 text-white font-bold text-lg rounded-xl shadow-lg transition transform active:scale-95 flex justify-center items-center gap-2
                        ${isLoading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-indigo-500/30'
                        }`}
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            {status}
                        </>
                    ) : (
                        "🚀 Tạo Học Bổng Mới"
                    )}
                </button>
            </form>
        </div>
    );
};

export default AdminDashboard;