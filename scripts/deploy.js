const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

  // Deploy FlashToken (Production Token)
  console.log("📝 Deploying FlashToken...");
  const FlashToken = await hre.ethers.getContractFactory("contracts/FlashToken.sol:FlashToken");
  const token = await FlashToken.deploy("USDTP", "USDTP");
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ FlashToken deployed to:", tokenAddress);

  // Deploy FlashFaucetSecure (Production Faucet)
  console.log("\n📝 Deploying FlashFaucetSecure...");
  const FlashFaucetSecure = await hre.ethers.getContractFactory("contracts/FlashFaucetSecure.sol:FlashFaucetSecure");
  const faucet = await FlashFaucetSecure.deploy(tokenAddress);
  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();
  console.log("✅ FlashFaucetSecure deployed to:", faucetAddress);

  // Set faucet contract as minter in token
  console.log("\n🔑 Setting FlashFaucetSecure as minting contract...");
  const tx = await token.setFaucetContract(faucetAddress);
  await tx.wait();
  console.log("✅ Faucet contract set in token");

  // Verify contracts on testnet (if not local)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations before verification...");
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

    try {
      console.log("\n🔍 Verifying FlashToken...");
      await hre.run("verify:verify", {
        address: tokenAddress,
        constructorArguments: ["USDTP", "USDTP"],
      });
      console.log("✅ FlashToken verified");

      console.log("\n🔍 Verifying FlashFaucetSecure...");
      await hre.run("verify:verify", {
        address: faucetAddress,
        constructorArguments: [tokenAddress],
      });
      console.log("✅ FlashFaucetSecure verified");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("\nContract Addresses:");
  console.log("  - FlashToken:", tokenAddress);
  console.log("  - FlashFaucetSecure:", faucetAddress);
  console.log("\n🔗 Frontend Configuration:");
  console.log("  Token Address:", tokenAddress);
  console.log("  Token Symbol: USDTP");
  console.log("  Token Decimals: 6");
  console.log("  Faucet Address:", faucetAddress);
  console.log("\n" + "=".repeat(60));

  // Save to a file for frontend
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      FlashToken: tokenAddress,
      FlashFaucetSecure: faucetAddress,
    },
  };
  
  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n💾 Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
