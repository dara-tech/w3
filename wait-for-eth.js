// Script to check balance and automatically deploy when ETH arrives
require("dotenv").config();
const { ethers } = require("ethers");
const { exec } = require("child_process");

const address = "0x583bf4fa3db204beFe452Bf40e868C16011eC584";
const provider = new ethers.JsonRpcProvider(
  process.env.SEPOLIA_RPC_URL || `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY || ''}`
);

let lastBalance = "0";

async function checkAndDeploy() {
  try {
    const balance = await provider.getBalance(address);
    const balanceInEth = ethers.formatEther(balance);
    
    if (balanceInEth !== lastBalance) {
      console.log("📍 Wallet Address:", address);
      console.log("💰 Balance:", balanceInEth, "ETH");
      lastBalance = balanceInEth;
      
      if (parseFloat(balanceInEth) >= 0.001) {
        console.log("\n✅ You have enough ETH! Deploying now...\n");
        exec("npm run deploy:sepolia", (error, stdout, stderr) => {
          if (error) {
            console.error("Deployment error:", error.message);
            return;
          }
          console.log(stdout);
          if (stderr) console.error(stderr);
        });
        return true;
      } else {
        console.log("⏳ Waiting for test ETH... (Need at least 0.001 ETH)");
        console.log("   Get it from: https://www.alchemy.com/faucets/ethereum-sepolia");
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
  return false;
}

console.log("🔍 Monitoring balance...");
console.log("📍 Address:", address);
console.log("📝 Get test ETH from: https://www.alchemy.com/faucets/ethereum-sepolia\n");

// Check every 10 seconds
const interval = setInterval(async () => {
  const deployed = await checkAndDeploy();
  if (deployed) {
    clearInterval(interval);
    console.log("\n✅ Deployment process started!");
  }
}, 10000);

// Also check immediately
checkAndDeploy();

