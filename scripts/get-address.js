const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer Address:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Current Balance:", ethers.formatEther(balance), "MON");
  
  console.log("\nRecommended amount to send: 0.5 MON");
  console.log("This will cover gas fees for deployment and testing.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
