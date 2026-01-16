import React, { useEffect, useState } from 'react';
import { getManagerContract, getTokenContract } from '../services/eth';
import { ethers } from 'ethers';

const ScholarshipList = () => {
    const [list, setList] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const manager = await getManagerContract();
                const token = await getTokenContract();
                if (!manager || !token) return;

                const count = await manager.nextScholarshipId();
                const decimals = await token.decimals();
                const symbol = await token.symbol(); // Lấy chữ "WCT"

                const items = [];
                for (let i = 0; i < Number(count); i++) {
                    const s = await manager.scholarships(i);
                    items.push({
                        id: Number(s.id),
                        title: s.title,
                        amount: ethers.formatUnits(s.amount, decimals), // Đổi Wei sang số thường
                        symbol: symbol,
                        slots: Number(s.slots),
                        deadline: new Date(Number(s.deadline) * 1000).toLocaleDateString()
                    });
                }
                setList(items);
            } catch (e) {
                console.error(e);
            }
        };
        load();
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-xl shadow border hover:-translate-y-1 transition duration-300">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h3>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-gray-500 text-sm">Giá trị:</p>
                            <span className="text-2xl font-bold text-green-600">
                                {Number(item.amount).toLocaleString()} {item.symbol}
                            </span>
                        </div>
                        <div className="text-right">
                             <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-semibold">
                                {item.slots} suất
                            </span>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xs text-gray-400">Hạn: {item.deadline}</span>
                        <button className="text-indigo-600 font-semibold text-sm hover:underline">
                            Xem chi tiết →
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ScholarshipList;