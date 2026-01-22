const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Dang deploy voi vi:", deployer.address);

  // 1. Deploy Token WCT trước
  const MyToken = await hre.ethers.getContractFactory("MyToken");
  const token = await MyToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  
  console.log("✅ WCT Token deployed at:", tokenAddress);

  // 2. Deploy ScholarshipManager (kèm địa chỉ WCT)
  const ScholarshipManager = await hre.ethers.getContractFactory("ScholarshipManager");
  const manager = await ScholarshipManager.deploy(tokenAddress);
  await manager.waitForDeployment();
  const managerAddress = await manager.getAddress();

  console.log("✅ ScholarshipManager deployed at:", managerAddress);
  
  console.log("\n--- COPY 2 DONG DUOI VAO FILE FRONTEND (src/services/eth.js) ---");
  console.log(`export const MANAGER_ADDRESS = "${managerAddress}";`);
  console.log(`export const TOKEN_ADDRESS = "${tokenAddress}";`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });