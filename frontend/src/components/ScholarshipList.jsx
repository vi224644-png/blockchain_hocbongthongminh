import React, { useEffect, useState } from 'react';
import { getManagerContract, getTokenContract } from '../services/eth';
import { ethers } from 'ethers';
import ScholarshipDetailModal from './ScholarshipDetailModal';

// Nhận prop refreshTrigger từ cha
const ScholarshipList = ({ refreshTrigger }) => {
    const [list, setList] = useState([]);
    const [selectedScholarship, setSelectedScholarship] = useState(null);
    const [loading, setLoading] = useState(false);

    // Tách hàm load ra để dễ quản lý
    const fetchScholarships = async () => {
        try {
            const manager = await getManagerContract();
            const token = await getTokenContract();
            if (!manager || !token) return;

            const count = await manager.nextScholarshipId();
            const decimals = await token.decimals();
            const symbol = await token.symbol();

            const items = [];
            // Lấy từ mới nhất về cũ nhất
            for (let i = Number(count) - 1; i >= 0; i--) {
                const s = await manager.scholarships(i);
                items.push({
                    id: Number(s.id),
                    title: s.title,
                    // --- KHỚP MÔ TẢ TẠI ĐÂY ---
                    // Ưu tiên lấy s.description (nếu contract trả về). Nếu rỗng thì dùng text mẫu.
                    description: (s.description && s.description.length > 0) ? s.description : "Chưa có mô tả chi tiết cho học bổng này.",
                    amount: ethers.formatUnits(s.amount, decimals),
                    symbol: symbol,
                    slots: Number(s.slots),
                    deadline: new Date(Number(s.deadline) * 1000).toLocaleDateString('vi-VN'),
                    timestamp: Number(s.deadline) * 1000
                });
            }
            setList(items);
        } catch (e) {
            console.error("Lỗi tải danh sách:", e);
        }
    };

    // Khi refreshTrigger thay đổi, gọi lại hàm fetch
    useEffect(() => {
        fetchScholarships();
    }, [refreshTrigger]);

    // Logic nộp hồ sơ (Giữ nguyên)
    const handleApplySubmit = async (scholarshipId, formData) => {
        setLoading(true);
        try {
             // Fake upload delay
             await new Promise(r => setTimeout(r, 1000));
             
             const manager = await getManagerContract();
             const tx = await manager.applyForScholarship(scholarshipId);
             await tx.wait();

             alert("✅ Nộp hồ sơ thành công!");
             setSelectedScholarship(null);
        } catch(e) {
            console.error(e);
            alert("Lỗi: " + (e.reason || e.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-8 uppercase tracking-wide">
                Danh Sách Học Bổng Hiện Có
            </h1>
            
            {list.length === 0 && (
                <div className="text-center text-gray-500 py-10">Đang tải hoặc chưa có học bổng nào...</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {list.map(item => (
                    <div key={item.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:-translate-y-1 transition duration-300 flex flex-col h-full">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 min-h-[3.5rem]">
                                {item.title}
                            </h3>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-gray-500 text-xs font-semibold uppercase">Giá trị</p>
                                    <span className="text-2xl font-bold text-green-600">
                                        {Number(item.amount).toLocaleString()} <span className="text-sm text-gray-500">{item.symbol}</span>
                                    </span>
                                </div>
                                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                                    {item.slots} suất
                                </span>
                            </div>
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-xs text-gray-400 font-medium">Hạn: {item.deadline}</span>
                            <button 
                                onClick={() => setSelectedScholarship(item)}
                                className="text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition shadow-md hover:shadow-lg"
                            >
                                Xem & Ứng tuyển →
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedScholarship && (
                <ScholarshipDetailModal 
                    scholarship={selectedScholarship}
                    onClose={() => setSelectedScholarship(null)}
                    onApplySubmit={handleApplySubmit}
                    loading={loading}
                />
            )}
        </div>
    );
};

export default ScholarshipList;