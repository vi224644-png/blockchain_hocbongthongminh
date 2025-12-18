import React, { useEffect, useState } from 'react';
import { getContract } from '../services/eth';
import { fetchScholarshipsDB } from '../services/api';
import { ethers } from 'ethers';

const ScholarshipList = () => {
    const [scholarships, setScholarships] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Lấy dữ liệu từ MongoDB
                const dbData = await fetchScholarshipsDB();
                
                // Lấy dữ liệu từ Blockchain
                const contract = await getContract();
                if (!contract) return; // Nếu chưa kết nối ví thì thôi

                const count = await contract.getScholarshipCount();
                
                const loadedItems = [];
                for (let i = 1; i <= Number(count); i++) {
                    const sc = await contract.scholarships(i);
                    const meta = dbData.find(d => d.blockchainId === i);
                    
                    loadedItems.push({
                        id: i,
                        name: sc.name,
                        // FIX: Ethers v6 dùng ethers.formatEther
                        amount: ethers.formatEther(sc.amount), 
                        slots: Number(sc.availableSlots),
                        desc: meta ? meta.description : "Đang tải mô tả..."
                    });
                }
                setScholarships(loadedItems);
            } catch (error) {
                console.error("Lỗi tải dữ liệu:", error);
            }
        };
        loadData();
    }, []);

    return (
    <div className="max-w-7xl mx-auto px-4 mt-12">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-10 tracking-tight">
            Danh Sách Học Bổng Đang Mở
        </h2>

        {scholarships.length === 0 && (
            <div className="text-center py-20 text-gray-500 text-lg animate-pulse">
                Đang tải dữ liệu học bổng...
            </div>
        )}

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {scholarships.map((sc) => (
                <div
                    key={sc.id}
                    className="
                        bg-white rounded-2xl shadow-md hover:shadow-xl 
                        transition-all duration-300 p-7 border border-gray-100
                        hover:-translate-y-1 group
                    "
                >
                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition">
                        {sc.name}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 mb-5 text-sm leading-relaxed line-clamp-3">
                        {sc.desc}
                    </p>

                    {/* Amount + Slots */}
                    <div className="flex items-center justify-between mb-6">
                        <span className="font-semibold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-lg text-sm">
                            {sc.amount} ETH / suất
                        </span>
                        <span className="text-gray-500 text-sm">
                            Còn: <span className="font-bold">{sc.slots}</span> suất
                        </span>
                    </div>

                    {/* Button */}
                    <button
                        className="
                            w-full bg-gradient-to-r from-indigo-500 to-indigo-600 
                            hover:from-indigo-600 hover:to-indigo-700
                            text-white font-semibold py-2.5 rounded-xl
                            shadow hover:shadow-lg transition-all duration-300
                        "
                    >
                        Nộp Đơn Ứng Tuyển
                    </button>
                </div>
            ))}
        </div>
    </div>
);

};

export default ScholarshipList;