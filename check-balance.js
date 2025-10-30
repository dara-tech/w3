// Quick script to check Sepolia balance
require("dotenv").config();
const { ethers } = require("ethers");

async function checkBalance() {
  const provider = new ethers.JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL || `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY || ''}`
  );
  
  const address = "0x583bf4fa3db204beFe452Bf40e868C16011eC584";
  
  try {
    const balance = await provider.getBalance(address);
    const balanceInEth = ethers.formatEther(balance);
    
    console.log("📍 Wallet Address:", address);
    console.log("💰 Balance:", balanceInEth, "ETH");
    
    if (parseFloat(balanceInEth) >= 0.001) {
      console.log("✅ You have enough ETH to deploy!");
    } else {
      console.log("❌ Need more ETH. Get it from: https://www.alchemy.com/faucets/ethereum-sepolia");
    }
  } catch (error) {
    console.error("Error checking balance:", error.message);
  }
}

checkBalance();

