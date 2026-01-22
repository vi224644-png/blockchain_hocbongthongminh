const { ethers } = require("ethers");
const ScholarshipArtifact = require("../../contracts/ScholarshipManager.json");

const getProvider = () => {
  return new ethers.JsonRpcProvider(process.env.NETWORK);
};

const getWallet = () => {
  const provider = getProvider();
  return new ethers.Wallet(process.env.PRIVATE_KEY, provider);
};

const getContract = () => {
  const wallet = getWallet();
  return new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    ScholarshipArtifact.abi,
    wallet
  );
};

/**
 * Tạo học bổng trên Blockchain
 */
const createScholarshipOnChain = async ({
  title,
  amountEth,
  slots,
  durationDays = 30
}) => {
  const contract = getContract();

  const amountWei = ethers.parseEther(amountEth.toString());
  const slotsBigInt = BigInt(slots);

  const deadline =
    Math.floor(Date.now() / 1000) + durationDays * 24 * 60 * 60;

  const totalFund = amountWei * slotsBigInt;

  const tx = await contract.createScholarship(
    title,
    amountWei,
    slotsBigInt,
    deadline,
    { value: totalFund }
  );

  const receipt = await tx.wait();

  // Lấy scholarshipId từ event
  let scholarshipId = null;
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed.name === "ScholarshipCreated") {
        scholarshipId = Number(parsed.args[0]);
        break;
      }
    } catch (_) {}
  }

  return {
    scholarshipId,
    txHash: tx.hash
  };
};

/**
 * Approve application (ví dụ)
 */
const approveApplicationOnChain = async (scholarshipId, studentAddress) => {
  const contract = getContract();
  const tx = await contract.approveApplication(
    scholarshipId,
    studentAddress
  );
  await tx.wait();
  return tx.hash;
};

module.exports = {
  createScholarshipOnChain,
  approveApplicationOnChain
};
