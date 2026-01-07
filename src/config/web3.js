const Web3 = require('web3');
require('dotenv').config();

// Create Web3 instance
const web3 = new Web3(process.env.WEB3_PROVIDER || 'http://localhost:8545');

// Contract ABI (will be generated after compiling)
const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "_companyName", "type": "string"},
            {"internalType": "string", "name": "_email", "type": "string"}
        ],
        "name": "registerSponsor",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "_name", "type": "string"},
            {"internalType": "string", "name": "_description", "type": "string"},
            {"internalType": "uint256", "name": "_amount", "type": "uint256"},
            {"internalType": "string", "name": "_criteria", "type": "string"},
            {"internalType": "uint256", "name": "_deadline", "type": "uint256"},
            {"internalType": "uint256", "name": "_maxRecipients", "type": "uint256"},
            {"internalType": "string", "name": "_category", "type": "string"},
            {"internalType": "string[]", "name": "_requiredDocuments", "type": "string[]"}
        ],
        "name": "createScholarship",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_scholarshipId", "type": "uint256"},
            {"internalType": "string", "name": "_documentHash", "type": "string"},
            {"internalType": "string", "name": "_transcriptHash", "type": "string"}
        ],
        "name": "applyForScholarship",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_applicationId", "type": "uint256"},
            {"internalType": "uint256", "name": "_score", "type": "uint256"},
            {"internalType": "string", "name": "_status", "type": "string"},
            {"internalType": "string", "name": "_reviewNotes", "type": "string"}
        ],
        "name": "reviewApplication",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Utility functions
const getAccounts = async () => {
    return await web3.eth.getAccounts();
};

const getBalance = async (address) => {
    return await web3.eth.getBalance(address);
};

const sendTransaction = async (from, to, value, data = '0x') => {
    const gasPrice = await web3.eth.getGasPrice();
    const gasLimit = process.env.GAS_LIMIT || 3000000;
    
    const tx = {
        from,
        to,
        value: web3.utils.toWei(value.toString(), 'ether'),
        gasPrice,
        gas: gasLimit,
        data
    };
    
    return await web3.eth.sendTransaction(tx);
};

module.exports = {
    web3,
    contract,
    contractABI,
    contractAddress,
    getAccounts,
    getBalance,
    sendTransaction
};