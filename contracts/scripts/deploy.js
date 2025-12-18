const hre = require("hardhat");

async function main() {
  // Sửa tên thành "ScholarshipManager" cho khớp với code Solidity
  const ScholarshipManager = await hre.ethers.getContractFactory("ScholarshipManager");
  
  console.log("Deploying ScholarshipManager...");
  const scholarship = await ScholarshipManager.deploy();

  await scholarship.waitForDeployment();

  console.log("ScholarshipManager deployed to:", await scholarship.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
