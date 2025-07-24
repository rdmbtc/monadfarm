const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying MonadFarmSwap contract...");

  // Get the contract factory
  const MonadFarmSwap = await ethers.getContractFactory("MonadFarmSwap");

  // Deploy the contract
  const monadFarmSwap = await MonadFarmSwap.deploy();

  // Wait for deployment to complete
  await monadFarmSwap.waitForDeployment();

  const contractAddress = await monadFarmSwap.getAddress();
  console.log("MonadFarmSwap deployed to:", contractAddress);

  // Verify the supported tokens were added correctly
  console.log("\nVerifying supported tokens...");
  const supportedTokens = await monadFarmSwap.getAllSupportedTokens();
  console.log("Number of supported tokens:", supportedTokens.length);

  for (let i = 0; i < supportedTokens.length; i++) {
    const tokenAddress = supportedTokens[i];
    try {
      const tokenInfo = await monadFarmSwap.getTokenInfo(tokenAddress);
      console.log(`Token ${i + 1}: ${tokenInfo.symbol} (${tokenInfo.name}) - ${tokenAddress}`);
    } catch (error) {
      console.log(`Token ${i + 1}: Error getting info for ${tokenAddress} - ${error.message}`);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    deploymentTime: new Date().toISOString(),
    network: "monad-testnet",
    supportedTokens: []
  };

  for (let i = 0; i < supportedTokens.length; i++) {
    const tokenAddress = supportedTokens[i];
    try {
      const tokenInfo = await monadFarmSwap.getTokenInfo(tokenAddress);
      deploymentInfo.supportedTokens.push({
        address: tokenAddress,
        symbol: tokenInfo.symbol,
        name: tokenInfo.name
      });
    } catch (error) {
      deploymentInfo.supportedTokens.push({
        address: tokenAddress,
        symbol: "Unknown",
        name: "Unknown",
        error: error.message
      });
    }
  }

  console.log("\nDeployment completed successfully!");
  console.log("Contract address:", contractAddress);
  console.log("\nDeployment info:", JSON.stringify(deploymentInfo, null, 2));

  return contractAddress;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((contractAddress) => {
    console.log("\n=== DEPLOYMENT SUMMARY ===");
    console.log("MonadFarmSwap contract deployed at:", contractAddress);
    console.log("Ready to use for token swapping on Monad Testnet!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
