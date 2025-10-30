import { ethers } from 'ethers';

// Contract ABIs (minimal for our purposes)
export const TOKEN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function name() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

export const FAUCET_ABI = [
  'function requestFlash(uint256 amount)',
  'function getUserInfo(address user) view returns (uint256, uint256, uint256, uint256)',
  'function requestCooldown() view returns (uint256)',
  'function maxRequestAmount() view returns (uint256)',
  'function dailyCapPerUser() view returns (uint256)',
  'event FlashRequested(address indexed requester, uint256 amount)',
  'event FlashGranted(address indexed to, uint256 amount)',
];

// Contract addresses - update these after deployment
// Default to localhost addresses from deployment
export let CONTRACT_ADDRESSES = {
  token: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  faucet: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
};

// Try to load deployment info dynamically
const loadDeploymentInfo = async () => {
  try {
    const response = await fetch('/deployment-info.json');
    if (response.ok) {
      const data = await response.json();
      CONTRACT_ADDRESSES = {
        token: data.contracts.FlashToken,
        faucet: data.contracts.FlashFaucetSecure,
      };
    }
  } catch (e) {
    console.log('Using default contract addresses');
  }
};

// Load deployment info on module load
loadDeploymentInfo();

// Helper functions
export const formatTokenAmount = (amount, decimals = 6) => {
  return ethers.formatUnits(amount, decimals);
};

export const parseTokenAmount = (amount, decimals = 6) => {
  return ethers.parseUnits(amount, decimals);
};

export const getTokenContract = (signer) => {
  if (!CONTRACT_ADDRESSES.token) {
    throw new Error('Token not deployed yet');
  }
  return new ethers.Contract(CONTRACT_ADDRESSES.token, TOKEN_ABI, signer);
};

export const getFaucetContract = (signer) => {
  if (!CONTRACT_ADDRESSES.faucet) {
    throw new Error('Faucet not deployed yet');
  }
  return new ethers.Contract(CONTRACT_ADDRESSES.faucet, FAUCET_ABI, signer);
};

// Prompt MetaMask to watch the token asset
export const watchTokenInMetaMask = async () => {
  if (!window.ethereum) {
    console.warn('MetaMask is not installed');
    return false;
  }
  
  if (!CONTRACT_ADDRESSES.token) {
    console.warn('Token contract address not available');
    return false;
  }
  
  try {
    // Always use USDT as symbol and 6 decimals
    // This ensures consistency even if contract was deployed with different values
    const symbol = 'USDT';
    const decimals = 6;
    
    const wasAdded = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: CONTRACT_ADDRESSES.token,
          symbol: symbol,
          decimals: decimals,
        },
      },
    });
    return Boolean(wasAdded);
  } catch (err) {
    console.error('watchAsset failed', err);
    return false;
  }
};

