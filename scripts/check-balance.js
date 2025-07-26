const { ethers, network } = require("hardhat");

async function main() {
  console.log(`Checking balance on network: ${network.name}`);

  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  const balanceInMON = ethers.formatEther(balance);
  
  console.log(`Balance: ${balanceInMON} MON`);
  
  if (parseFloat(balanceInMON) < 0.1) {
    console.log("\n❌ Insufficient balance for deployment!");
    console.log("You need at least 0.1 MON for gas fees.");
    console.log("\n🚰 To get Monad testnet tokens:");
    console.log("1. Visit the Monad testnet faucet");
    console.log("2. Enter your wallet address:", deployer.address);
    console.log("3. Request testnet MON tokens");
    console.log("4. Wait for the transaction to confirm");
    console.log("5. Run this script again to check your balance");
  } else {
    console.log("\n✅ Sufficient balance for deployment!");
    console.log("You can proceed with deploying the FarmGame contract.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
