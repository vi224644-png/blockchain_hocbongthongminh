import React, { useState } from 'react';
import ScholarshipList from './components/ScholarshipList';
import AdminDashboard from './components/AdminDashboard';
import { connectWallet } from './services/eth';
import { ethers } from 'ethers'; // Import thêm ethers để lấy số dư

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState("0"); // State lưu số dư

  const handleConnect = async () => {
    const acc = await connectWallet();
    if (acc) {
      setAccount(acc);
      await getBalance(acc); // Gọi hàm lấy số dư ngay khi kết nối
    }
  };

  // Hàm lấy số dư từ ví
  const getBalance = async (walletAddress) => {
    try {
      // Kết nối provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      // Lấy balance (trả về BigInt Wei)
      const balanceWei = await provider.getBalance(walletAddress);
      // Chuyển sang ETH (string)
      const balanceEth = ethers.formatEther(balanceWei);
      setBalance(balanceEth);
    } catch (error) {
      console.error("Không lấy được số dư:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      <nav className="
        flex justify-between items-center 
        px-6 py-4 
        bg-gradient-to-r from-gray-900 to-gray-800 
        text-white shadow-lg sticky top-0 z-50
        rounded-b-xl
      ">
        <h1 className="text-2xl font-extrabold tracking-wide flex items-center gap-2">
           <span className="text-indigo-400">Blockchain</span> Scholarship
        </h1>

        {!account ? (
          <button
            onClick={handleConnect}
            className="
              bg-gradient-to-r from-indigo-500 to-indigo-600 
              hover:from-indigo-600 hover:to-indigo-700 
              px-5 py-2 rounded-xl text-sm font-semibold
              shadow-md hover:shadow-xl transition-all duration-300
              flex items-center gap-2
            "
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
              className="w-5"
              alt="fox"
            />
            Connect Wallet
          </button>
        ) : (
          <div className="flex items-center gap-3">
            {/* Hiển thị số dư */}
            <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-xs text-gray-400">Balance</span>
                <span className="text-yellow-400 font-bold font-mono">
                    {parseFloat(balance).toFixed(4)} ETH
                </span>
            </div>

            {/* Hiển thị địa chỉ ví */}
            <span className="text-sm bg-gray-700 px-4 py-2 rounded-lg shadow-inner font-semibold tracking-wide border border-gray-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                {account.slice(0, 6)}...{account.slice(-4)}
            </span>
          </div>
        )}
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-12">

        {/* Admin Panel */}
        <div className="mb-14 bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
             <span>Admin Dashboard</span>
          </h2>
          <AdminDashboard />
        </div>

        {/* Divider */}
        <div className="my-14 w-full h-[1px] bg-gray-300 rounded-full"></div>

        {/* Scholarship List */}
        <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            📌 <span>Danh Sách Học Bổng</span>
          </h2>
          <ScholarshipList />
        </div>

      </main>
    </div>
  );
}

export default App;