const Web3 = require("web3");

const web3 = new Web3(process.env.WEB3_PROVIDER);

module.exports = web3;
