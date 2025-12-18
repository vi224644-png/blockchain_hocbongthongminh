const { ethers } = require('ethers');
const abi = require('../../frontend/src/contracts/Scholarship.json'); // hoặc copy ABI сюда

const getProvider = (rpcUrl) => new ethers.JsonRpcProvider(rpcUrl);

function getContract(rpcUrl, contractAddress, privateKey) {
    const provider = getProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
return new ethers.Contract(contractAddress, abi, wallet);
}

module.exports = { getContract, getProvider };