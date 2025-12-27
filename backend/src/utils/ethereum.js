const { ethers } = require('ethers');

// 1. SỬA ĐƯỜNG DẪN: Trỏ vào thư mục contracts của Backend
// (Đảm bảo bạn đã copy file ScholarshipManager.json vào backend/src/contracts/)
const ScholarshipArtifact = require('../contracts/ScholarshipManager.json'); 

const getProvider = (rpcUrl) => new ethers.JsonRpcProvider(rpcUrl);

function getContract(rpcUrl, contractAddress, privateKey) {
    const provider = getProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // 2. SỬA ABI: Hardhat artifact là object, ABI nằm trong thuộc tính .abi
    return new ethers.Contract(contractAddress, ScholarshipArtifact.abi, wallet);
}

module.exports = { getContract, getProvider };