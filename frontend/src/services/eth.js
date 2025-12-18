import { ethers } from 'ethers';

// SỬA TÊN FILE Ở ĐÂY CHO ĐÚNG VỚI TÊN CONTRACT
import ScholarshipArtifact from '../contracts/ScholarshipManager.json'; 

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

export const getEthereumObject = () => window.ethereum;

export const connectWallet = async () => {
    if (!getEthereumObject()) return alert("Hãy cài đặt MetaMask!");
    
    // Ethers v6 dùng BrowserProvider
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    return accounts[0];
};

export const getContract = async () => {
    if (!getEthereumObject()) return null;
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner(); 
    
    // Khởi tạo contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ScholarshipArtifact.abi, signer);
    return contract;
};