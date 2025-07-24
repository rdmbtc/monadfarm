const { ethers } = require("hardhat");

async function main() {
  console.log("Getting wallet address from private key...");
  
  try {
    // Get the signer from the configured network
    const [signer] = await ethers.getSigners();
    const address = await signer.getAddress();
    
    console.log("\n=== WALLET INFORMATION ===");
    console.log("Wallet Address:", address);
    
    // Try to get balance
    try {
      const balance = await signer.provider.getBalance(address);
      const balanceInMON = ethers.formatEther(balance);
      console.log("Current Balance:", balanceInMON, "MON");
      
      if (parseFloat(balanceInMON) === 0) {
        console.log("\n❌ No MON tokens found!");
        console.log("You need to get testnet MON tokens to deploy the contract.");
      } else if (parseFloat(balanceInMON) < 0.01) {
        console.log("\n⚠️  Low balance! You might need more MON for deployment.");
      } else {
        console.log("\n✅ Sufficient balance for deployment!");
      }
    } catch (balanceError) {
      console.log("Could not fetch balance:", balanceError.message);
    }
    
    console.log("\n=== NEXT STEPS ===");
    console.log("1. Copy your wallet address:", address);
    console.log("2. Get MON testnet tokens from a faucet");
    console.log("3. Wait for tokens to arrive");
    console.log("4. Run deployment again");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
