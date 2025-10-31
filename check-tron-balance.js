// Script to check Tron balance (TRX and USDTP token) using TronGrid API
require("dotenv").config();

const TRON_NETWORK = "shasta"; // or "mainnet"
const API_BASE = TRON_NETWORK === "shasta" 
  ? "https://api.shasta.trongrid.io"
  : "https://api.trongrid.io";

// Your Tron address from the logs
const TRON_ADDRESS = "TXktmJ2n7aY2Tv4mj3Pf5Po2i3r9iKYEhx";

// Token contract address (from deployment info or contracts.js)
const TOKEN_ADDRESS = "TX8umnfcZpJnHnmXWmiVrNE21ZJaQaQMhP";

// Helper to convert SUN to TRX (1 TRX = 1,000,000 SUN)
function sunToTrx(sun) {
  return (parseInt(sun) / 1000000).toFixed(6);
}

// Helper to convert token amount (with 6 decimals)
function tokenAmount(amount) {
  return (parseInt(amount) / 1000000).toFixed(6);
}

async function checkTronBalance() {
  try {
    console.log("\n🔍 Checking Tron Balance...");
    console.log("📍 Wallet Address:", TRON_ADDRESS);
    console.log("🌐 Network:", TRON_NETWORK.toUpperCase());
    console.log("─".repeat(50));

    // Check TRX balance using TronGrid API
    try {
      const response = await fetch(`${API_BASE}/wallet/getaccount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: TRON_ADDRESS,
          visible: true
        })
      });
      const data = await response.json();
      
      if (data.balance !== undefined) {
        const trxBalance = sunToTrx(data.balance);
        console.log("💰 TRX Balance:", trxBalance, "TRX");
        
        const balanceNum = parseFloat(trxBalance);
        if (balanceNum >= 1) {
          console.log("✅ You have enough TRX for transactions!");
        } else if (balanceNum >= 0.1) {
          console.log("⚠️  Low TRX balance. Consider adding more for multiple transactions.");
        } else if (balanceNum > 0) {
          console.log("⚠️  Very low TRX balance. Add more TRX for transactions.");
        } else {
          console.log("❌ No TRX balance. Get it from Shasta faucet:");
          console.log("   https://www.trongrid.io/faucet");
        }
      } else {
        console.log("⚠️  Account not found or not activated yet.");
        console.log("   In Tron, accounts need to be activated (receive first transaction)");
      }
    } catch (err) {
      console.error("❌ Error checking TRX balance:", err.message);
    }

    // Check USDTP token balance by calling contract's balanceOf function
    try {
      // Convert base58 address to hex for contract call
      // For balanceOf(address), we need to encode the function signature and parameter
      // balanceOf(address) signature: 0x70a08231
      // Parameter: address padded to 32 bytes (64 hex chars)
      
      // Simple hex conversion (base58 to hex - this is a simplified version)
      // For production, you'd use a proper base58 decoder, but for checking we can use API
      const convertAddressResponse = await fetch(`${API_BASE}/wallet/base58tohex`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: TRON_ADDRESS })
      });
      const hexAddress = await convertAddressResponse.json();
      const addressHex = hexAddress.hex || '';
      
      if (!addressHex) {
        throw new Error('Could not convert address to hex');
      }
      
      // Function signature for balanceOf(address): 0x70a08231
      // Parameter: address (20 bytes = 40 hex chars), padded to 32 bytes (64 hex chars)
      const functionSignature = '70a08231'; // balanceOf(address)
      const paddedAddress = addressHex.replace(/^41/, '0x').padStart(66, '0'); // Convert 41... to 0x00...41...
      const paddedAddressNoPrefix = paddedAddress.replace(/^0x/, '').padStart(64, '0');
      
      const functionCall = functionSignature + paddedAddressNoPrefix;
      
      const contractResponse = await fetch(`${API_BASE}/wallet/triggerconstantcontract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_address: TRON_ADDRESS,
          contract_address: TOKEN_ADDRESS,
          function_selector: 'balanceOf(address)',
          parameter: paddedAddressNoPrefix,
          visible: true
        })
      });
      
      const contractData = await contractResponse.json();
      
      if (contractData.constant_result && contractData.constant_result.length > 0) {
        const balanceHex = '0x' + contractData.constant_result[0];
        const balanceBigInt = BigInt(balanceHex);
        const balance = tokenAmount(balanceBigInt.toString());
        
        console.log("\n🎯 USDTP Token Balance:", balance, "USDTP");
        console.log("📍 Token Contract:", TOKEN_ADDRESS);
        
        if (parseFloat(balance) === 0) {
          console.log("ℹ️  Token balance is 0. Request tokens from the faucet!");
        }
      } else if (contractData.Error) {
        console.log("\n⚠️  Error calling contract:", contractData.Error);
        console.log("   This might mean:");
        console.log("   1. Contract not deployed at this address");
        console.log("   2. Wrong network (check if contracts are on Shasta)");
        console.log("   3. Contract address mismatch");
      } else {
        console.log("\n⚠️  Could not retrieve token balance.");
        console.log("   Token Contract:", TOKEN_ADDRESS);
      }
    } catch (err) {
      console.error("\n❌ Error checking token balance:", err.message);
      console.log("   Token Contract:", TOKEN_ADDRESS);
      console.log("   Note: This might be normal if the contract isn't deployed yet.");
    }

    console.log("─".repeat(50));
    console.log("✅ Balance check complete!\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkTronBalance();

