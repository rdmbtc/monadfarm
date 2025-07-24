const fs = require('fs');
const path = require('path');

// Script to update contract address in frontend components after deployment
function updateContractAddress(contractAddress) {
  if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
    console.error("Please provide a valid contract address");
    console.log("Usage: node scripts/update-contract-address.js 0xYourContractAddress");
    process.exit(1);
  }

  const files = [
    'components/monad-token-swap.tsx',
    'components/token-swap.tsx'
  ];

  files.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Update the FARM_SWAP_ADDRESS
      const oldPattern = /const FARM_SWAP_ADDRESS = "0x0000000000000000000000000000000000000000"/g;
      const newValue = `const FARM_SWAP_ADDRESS = "${contractAddress}"`;
      
      if (content.match(oldPattern)) {
        content = content.replace(oldPattern, newValue);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Updated ${filePath}`);
      } else {
        console.log(`⚠️  Pattern not found in ${filePath}`);
      }
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
    }
  });

  // Update the deployment config
  const configPath = path.join(__dirname, '..', 'nooter contract', 'monad-deployment-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.contracts.MonadFarmSwap.address = contractAddress;
    config.contracts.MonadFarmSwap.deploymentStatus = "deployed";
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    console.log(`✅ Updated deployment config`);
  }

  console.log(`\n🎉 Contract address updated to: ${contractAddress}`);
  console.log("\nNext steps:");
  console.log("1. Test the frontend with the new contract address");
  console.log("2. Verify all token swapping works correctly");
  console.log("3. Check Farm Coins balance updates");
}

// Get contract address from command line argument
const contractAddress = process.argv[2];
updateContractAddress(contractAddress);
