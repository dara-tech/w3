import { ethers } from 'ethers';
import TronWeb from 'tronweb';
import { NETWORKS } from './network';

// Contract ABIs for Ethereum
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
  'function mint(address to, uint256 amount)',
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

// Tron contract ABI (same interface but in JSON format for TronWeb)
export const TOKEN_ABI_TRON = [
  {
    constant: true,
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    type: 'function',
  },
];

export const FAUCET_ABI_TRON = [
  {
    constant: false,
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'requestTokens',
    outputs: [],
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserInfo',
    outputs: [
      { name: 'timeUntilNextRequest', type: 'uint256' },
      { name: 'claimedToday', type: 'uint256' },
      { name: 'remainingCap', type: 'uint256' },
    ],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'requestCooldown',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'maxRequestAmount',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'dailyCapPerUser',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
];

// Contract addresses by network
export let CONTRACT_ADDRESSES = {
  [NETWORKS.ETHEREUM]: {
    token: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    faucet: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  },
  [NETWORKS.TRON]: {
    token: 'TX8umnfcZpJnHnmXWmiVrNE21ZJaQaQMhP', // Tron Shasta Testnet
    faucet: 'TYmM9E3Gqq3H7nNwxaNfGwthydMEVQzsZF', // Tron Shasta Testnet
  },
};

// Try to load deployment info dynamically
const loadDeploymentInfo = async () => {
  try {
    const response = await fetch('/deployment-info.json');
    if (response.ok) {
      const data = await response.json();
      if (data.contracts) {
        CONTRACT_ADDRESSES[NETWORKS.ETHEREUM] = {
          token: data.contracts.FlashToken || CONTRACT_ADDRESSES[NETWORKS.ETHEREUM].token,
          faucet: data.contracts.FlashFaucetSecure || CONTRACT_ADDRESSES[NETWORKS.ETHEREUM].faucet,
        };
      }
      if (data.tron && data.tron.contracts) {
        CONTRACT_ADDRESSES[NETWORKS.TRON] = {
          token: data.tron.contracts.UsdtToken || data.tron.contracts.FlashToken || CONTRACT_ADDRESSES[NETWORKS.TRON].token,
          faucet: data.tron.contracts.UsdtFaucet || data.tron.contracts.FlashFaucetSecure || CONTRACT_ADDRESSES[NETWORKS.TRON].faucet,
        };
      }
    }
  } catch (e) {
    console.log('Using default contract addresses');
  }
};

// Load deployment info on module load
loadDeploymentInfo();

/**
 * Get contract addresses for a specific network
 */
export const getContractAddresses = (network) => {
  return CONTRACT_ADDRESSES[network] || CONTRACT_ADDRESSES[NETWORKS.ETHEREUM];
};

/**
 * Format token amount (works for both networks)
 */
export const formatTokenAmount = (amount, decimals = 6) => {
  if (!amount) return '0';
  
  // Handle BigNumber from ethers
  if (amount.toString && typeof amount.toString === 'function') {
    const str = amount.toString();
    if (decimals === 0) return str;
    
    const padded = str.padStart(decimals + 1, '0');
    const integerPart = padded.slice(0, -decimals) || '0';
    const decimalPart = padded.slice(-decimals).replace(/\.?0+$/, '');
    
    if (decimalPart === '') {
      return integerPart;
    }
    return `${integerPart}.${decimalPart}`;
  }
  
  // Handle string or number
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return (num / Math.pow(10, decimals)).toFixed(decimals).replace(/\.?0+$/, '');
};

/**
 * Parse token amount (works for both networks)
 */
export const parseTokenAmount = (amount, decimals = 6) => {
  if (typeof amount === 'number') {
    return BigInt(Math.floor(amount * Math.pow(10, decimals)));
  }
  
  const num = parseFloat(amount);
  if (isNaN(num)) throw new Error('Invalid amount');
  
  return BigInt(Math.floor(num * Math.pow(10, decimals)));
};

/**
 * Get token contract (unified API for both networks)
 * Returns null if contract address is not available
 */
export const getTokenContract = (signer, network = NETWORKS.ETHEREUM) => {
  const addresses = getContractAddresses(network);
  
  if (!addresses.token) {
    if (network === NETWORKS.TRON) {
      console.warn('Tron token contract address not configured. Contracts need to be deployed on Tron network.');
    }
    return null;
  }
  
  if (network === NETWORKS.TRON) {
    // For Tron, signer is TronWeb instance
    if (!signer || !signer.contract) {
      console.error('TronWeb instance required for Tron network. TronWeb available:', !!window.tronWeb, 'signer:', !!signer);
      return null;
    }
    
    if (!addresses.token) {
      console.warn('Tron token contract address not set. Available addresses:', addresses);
      return null;
    }
    
    try {
      // TronWeb expects base58 addresses (T...) for contract() method
      // If address is hex (41...), convert to base58
      let contractAddress = addresses.token;
      if (contractAddress.startsWith('41')) {
        if (signer.address && signer.address.fromHex) {
          contractAddress = signer.address.fromHex(contractAddress);
        }
      }
      
      console.log('Creating Tron token contract at address:', contractAddress);
      
      // Ensure TronWeb is ready and has network configuration
      if (!signer.fullNode || !signer.fullNode.host) {
        console.warn('TronWeb fullNode not configured. This might cause TronLink errors.');
      }
      
      const contract = signer.contract(TOKEN_ABI_TRON, contractAddress);
      
      // Ensure contract has all necessary properties for TronLink
      if (contract) {
        if (!contract.address && contractAddress) {
          contract.address = contractAddress;
        }
        if (!contract._address && contractAddress) {
          contract._address = contractAddress;
        }
        
        // Ensure contract has ABI (TronLink might access this)
        if (!contract._abi && contract.abi) {
          contract._abi = contract.abi;
        }
        if (!contract.abi && TOKEN_ABI_TRON) {
          contract.abi = TOKEN_ABI_TRON;
          contract._abi = TOKEN_ABI_TRON;
        }
        
        // Ensure contract has tronWeb reference (TronLink accesses this)
        if (!contract._tronWeb && contract.tronWeb) {
          contract._tronWeb = contract.tronWeb;
        }
        if (!contract.tronWeb && signer) {
          contract.tronWeb = signer;
          contract._tronWeb = signer;
        }
        
        // Copy network properties from TronWeb to contract (TronLink might need these)
        if (signer.fullNode && !contract.fullNode) {
          contract.fullNode = signer.fullNode;
        }
        if (signer.solidityNode && !contract.solidityNode) {
          contract.solidityNode = signer.solidityNode;
        }
        if (signer.eventServer && !contract.eventServer) {
          contract.eventServer = signer.eventServer;
        }
      }
      
      // Verify contract has expected methods
      if (!contract.balanceOf) {
        console.warn('Tron token contract created but balanceOf method not found');
      }
      
      console.log('Tron token contract created:', {
        address: contract.address || contractAddress,
        hasBalanceOf: !!contract.balanceOf,
        hasFullNode: !!contract.fullNode,
      });
      
      return contract;
    } catch (err) {
      console.error('Error creating Tron token contract:', err);
      console.error('Contract address attempted:', addresses.token);
      return null;
    }
  } else {
    // For Ethereum, use ethers
    if (!signer) {
      console.error('Signer required for Ethereum network');
      return null;
    }
    
    try {
      return new ethers.Contract(addresses.token, TOKEN_ABI, signer);
    } catch (err) {
      console.error('Error creating Ethereum token contract:', err);
      return null;
    }
  }
};

/**
 * Get faucet contract (unified API for both networks)
 * Returns null if contract address is not available
 */
export const getFaucetContract = (signer, network = NETWORKS.ETHEREUM) => {
  const addresses = getContractAddresses(network);
  
  if (!addresses.faucet) {
    if (network === NETWORKS.TRON) {
      console.warn('Tron faucet contract address not configured. Contracts need to be deployed on Tron network.');
    }
    return null;
  }
  
  if (network === NETWORKS.TRON) {
    // For Tron, signer is TronWeb instance
    if (!signer || !signer.contract) {
      console.error('TronWeb instance required for Tron network. TronWeb available:', !!window.tronWeb, 'signer:', !!signer);
      return null;
    }
    
    if (!addresses.faucet) {
      console.warn('Tron faucet contract address not set. Available addresses:', addresses);
      return null;
    }
    
    try {
      // TronWeb expects base58 addresses (T...) for contract() method
      // If address is hex (41...), convert to base58
      let contractAddress = addresses.faucet;
      if (contractAddress.startsWith('41')) {
        if (signer.address && signer.address.fromHex) {
          contractAddress = signer.address.fromHex(contractAddress);
        }
      }
      
      console.log('Creating Tron faucet contract at address:', contractAddress);
      
      // Ensure TronWeb is ready and has network configuration
      if (!signer.fullNode || !signer.fullNode.host) {
        console.warn('TronWeb fullNode not configured. This might cause TronLink errors.');
      }
      
      const contract = signer.contract(FAUCET_ABI_TRON, contractAddress);
      
      // Ensure contract has all necessary properties for TronLink
      if (contract) {
        if (!contract.address && contractAddress) {
          contract.address = contractAddress;
        }
        if (!contract._address && contractAddress) {
          contract._address = contractAddress;
        }
        
        // Ensure contract has ABI (TronLink might access this)
        if (!contract._abi && contract.abi) {
          contract._abi = contract.abi;
        }
        if (!contract.abi && FAUCET_ABI_TRON) {
          contract.abi = FAUCET_ABI_TRON;
          contract._abi = FAUCET_ABI_TRON;
        }
        
        // Ensure contract has tronWeb reference (TronLink accesses this)
        if (!contract._tronWeb && contract.tronWeb) {
          contract._tronWeb = contract.tronWeb;
        }
        if (!contract.tronWeb && signer) {
          contract.tronWeb = signer;
          contract._tronWeb = signer;
        }
        
        // Copy network properties from TronWeb to contract (TronLink might need these)
        if (signer.fullNode && !contract.fullNode) {
          contract.fullNode = signer.fullNode;
        }
        if (signer.solidityNode && !contract.solidityNode) {
          contract.solidityNode = signer.solidityNode;
        }
        if (signer.eventServer && !contract.eventServer) {
          contract.eventServer = signer.eventServer;
        }
      }
      
      // Verify contract has expected methods
      if (!contract.getUserInfo) {
        console.warn('Tron faucet contract created but getUserInfo method not found');
      }
      
      console.log('Tron faucet contract created:', {
        address: contract.address || contractAddress,
        hasRequestTokens: !!contract.requestTokens,
        hasGetUserInfo: !!contract.getUserInfo,
        hasFullNode: !!contract.fullNode,
        hasABI: !!contract.abi,
        hasTronWeb: !!contract.tronWeb,
      });
      
      return contract;
    } catch (err) {
      console.error('Error creating Tron faucet contract:', err);
      console.error('Contract address attempted:', addresses.faucet);
      return null;
    }
  } else {
    // For Ethereum, use ethers
    if (!signer) {
      console.error('Signer required for Ethereum network');
      return null;
    }
    
    try {
      return new ethers.Contract(addresses.faucet, FAUCET_ABI, signer);
    } catch (err) {
      console.error('Error creating Ethereum faucet contract:', err);
      return null;
    }
  }
};

/**
 * Check if contract exists at address (Ethereum only)
 */
export const checkContractExists = async (address, provider, network = NETWORKS.ETHEREUM) => {
  if (network === NETWORKS.TRON) {
    // For Tron, we'll let the call fail and handle it
    return true;
  }
  
  try {
    const code = await provider.getCode(address);
    return code && code !== '0x';
  } catch (err) {
    console.error('Error checking contract existence:', err);
    return false;
  }
};

/**
 * Call contract method (unified for both networks)
 */
export const callContractMethod = async (contract, method, params = [], network = NETWORKS.ETHEREUM) => {
  if (network === NETWORKS.TRON) {
    // Tron contract calls use .call() for view functions
    if (!contract || !contract[method]) {
      throw new Error(`Method ${method} not found on contract`);
    }
    try {
      // Convert Tron addresses (base58) to hex format for contract calls
      const convertedParams = await Promise.all(params.map(async (p) => {
        if (typeof p === 'string' && p.startsWith('T') && p.length === 34) {
          // Base58 Tron address, convert to hex
          const tronWeb = window.tronWeb;
          if (tronWeb && tronWeb.address) {
            return tronWeb.address.toHex(p);
          }
        }
        // Convert BigInt to string for Tron
        if (typeof p === 'bigint') {
          return p.toString();
        }
        return p;
      }));
      
      const result = await contract[method](...convertedParams).call();
      
      // TronWeb returns results differently - convert to array if needed
      // For getUserInfo, it should return an array of 3 values
      if (Array.isArray(result)) {
        return result;
      }
      
      // If result is an object, convert to array based on method
      if (method === 'getUserInfo' && typeof result === 'object' && !Array.isArray(result)) {
        // TronWeb might return an object with indexed properties
        return [
          result[0] || result.timeUntilNextRequest || 0,
          result[1] || result.claimedToday || 0,
          result[2] || result.remainingCap || 0,
        ];
      }
      
      return result;
    } catch (err) {
      console.error(`Error calling ${method} on Tron:`, err);
      
      // Provide more detailed error message for Tron
      let errorMessage = err.message || err.toString() || 'Unknown error';
      
      // Check for specific Tron error types
      if (errorMessage.includes('REVERT') || errorMessage.includes('revert')) {
        errorMessage = `Contract call reverted. This might mean the contract method failed or the contract is not properly deployed. Method: ${method}`;
      } else if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
        errorMessage = `Contract or method not found. Ensure contracts are deployed on Tron network. Method: ${method}`;
      } else if (!errorMessage.includes('Contract')) {
        errorMessage = `Tron contract call failed: ${errorMessage}. Method: ${method}`;
      }
      
      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = err;
      throw enhancedError;
    }
  } else {
    // Ethereum contract calls
    if (!contract || !contract[method]) {
      throw new Error(`Method ${method} not found on contract`);
    }
    
    try {
      const result = await contract[method](...params);
      return result;
    } catch (err) {
      // Handle "could not decode result data" error - contract not deployed
      if (err.code === 'BAD_DATA' || err.message?.includes('could not decode result data')) {
        const addresses = getContractAddresses(network);
        
        // Try to verify if contract has code (to differentiate between wrong address vs no code)
        try {
          if (contract.provider || contract.runner?.provider) {
            const contractAddress = addresses[method.includes('Token') ? 'token' : 'faucet'] || 
                                   addresses.token || addresses.faucet;
            const provider = contract.provider || contract.runner?.provider;
            if (provider && contractAddress) {
              const code = await provider.getCode(contractAddress);
              if (!code || code === '0x') {
                throw new Error(
                  `Contract has no code at address ${contractAddress}. ` +
                  `This usually means: 1) Wrong network (expected Sepolia), 2) Contract not deployed, or 3) Wrong address.`
                );
              }
            }
          }
        } catch (verifyErr) {
          // If verification fails, still throw original error with more context
        }
        
        throw new Error(
          `Contract not found at address. Please ensure contracts are deployed on ${network} network. ` +
          `Token: ${addresses.token || 'Not set'}, Faucet: ${addresses.faucet || 'Not set'}. ` +
          `If you're on Sepolia, verify the addresses are correct.`
        );
      }
      throw err;
    }
  }
};

/**
 * Send contract transaction (unified for both networks)
 */
export const sendContractTransaction = async (contract, method, params = [], network = NETWORKS.ETHEREUM) => {
  if (network === NETWORKS.TRON) {
    // Clean and simple Tron transaction sending
    if (!contract || !contract[method]) {
      throw new Error(`Method ${method} not found on contract`);
    }
    
    const tronWeb = window.tronWeb;
    if (!tronWeb || !tronWeb.ready) {
      throw new Error('TronWeb is not available or not ready. Please ensure TronLink is installed and unlocked.');
    }
    
    if (!tronWeb.defaultAddress || !tronWeb.defaultAddress.base58) {
      throw new Error('TronWeb defaultAddress is not set. Please connect your TronLink wallet.');
    }
    
    // Convert params for Tron
    const convertedParams = await Promise.all(params.map(async (p) => {
      if (p === undefined || p === null) {
        throw new Error(`Invalid parameter: ${p}. All parameters must be defined.`);
      }
      
      // Convert Tron base58 address to hex
      if (typeof p === 'string' && p.startsWith('T') && p.length === 34) {
        return tronWeb.address.toHex(p);
      }
      
      // Convert BigInt/number to string for Tron
      if (typeof p === 'bigint' || typeof p === 'number') {
        return p.toString();
      }
      
      return p;
    }));
    
    // Declare methodCall outside try block so it's accessible in catch
    let methodCall;
    
    try {
      // Helper function to get node URL from tronWeb or default to Shasta testnet
      const getNodeUrl = (node) => {
        if (!node) return 'https://api.shasta.trongrid.io';
        if (typeof node === 'string') return node;
        if (node.host && typeof node.host === 'string') return node.host;
        // Fallback if structure is unexpected
        return 'https://api.shasta.trongrid.io';
      };
      
      // Helper function to create properly structured node object
      const createNodeObject = (nodeUrl) => {
        const url = String(nodeUrl || 'https://api.shasta.trongrid.io');
        return {
          host: url,
          headers: {},
          timeout: 30000,
        };
      };
      
      // Get node URLs from tronWeb or use defaults (Shasta testnet)
      const fullNodeUrl = getNodeUrl(tronWeb.fullNode);
      const solidityNodeUrl = getNodeUrl(tronWeb.solidityNode) || fullNodeUrl;
      const eventServerUrl = getNodeUrl(tronWeb.eventServer) || fullNodeUrl;
      
      // Call the contract method
      methodCall = contract[method](...convertedParams);
      
      if (!methodCall || typeof methodCall.send !== 'function') {
        throw new Error(`Method ${method} does not return a sendable transaction`);
      }
      
      // CRITICAL: Ensure methodCall.tronWeb has proper structure before TronLink accesses it
      // TronLink's _send method accesses methodCall.tronWeb.fullNode.host and calls toLowerCase()
      // The issue is that TronLink expects a very specific structure and might access it through multiple paths
      
      // Get or create the tronWeb reference on methodCall
      let targetTronWeb = methodCall.tronWeb;
      if (!targetTronWeb) {
        // If methodCall doesn't have tronWeb, use the contract's or create a new reference
        targetTronWeb = contract?.tronWeb || tronWeb;
        methodCall.tronWeb = targetTronWeb;
      }
      
      // Also set _tronWeb in case TronLink checks that
      if (!methodCall._tronWeb) {
        methodCall._tronWeb = targetTronWeb;
      }
      
      // CRITICAL FIX: Ensure fullNode.host exists and is a STRING before TronLink accesses it
      // This must be done in a way that creates a direct property, not a getter
      if (!targetTronWeb.fullNode) {
        targetTronWeb.fullNode = {};
      }
      // Force create host as a direct string property
      Object.defineProperty(targetTronWeb.fullNode, 'host', {
        value: String(fullNodeUrl),
        writable: true,
        enumerable: true,
        configurable: true,
      });
      // Ensure headers and timeout exist
      if (!targetTronWeb.fullNode.headers) {
        targetTronWeb.fullNode.headers = {};
      }
      if (!targetTronWeb.fullNode.timeout) {
        targetTronWeb.fullNode.timeout = 30000;
      }
      
      // Ensure solidityNode has proper structure
      if (!targetTronWeb.solidityNode) {
        targetTronWeb.solidityNode = {};
      }
      Object.defineProperty(targetTronWeb.solidityNode, 'host', {
        value: String(solidityNodeUrl),
        writable: true,
        enumerable: true,
        configurable: true,
      });
      
      // Ensure eventServer has proper structure
      if (!targetTronWeb.eventServer) {
        targetTronWeb.eventServer = {};
      }
      Object.defineProperty(targetTronWeb.eventServer, 'host', {
        value: String(eventServerUrl),
        writable: true,
        enumerable: true,
        configurable: true,
      });
      
      // Also fix contract.tronWeb if it exists and is different
      if (contract && contract.tronWeb && contract.tronWeb !== targetTronWeb) {
        if (!contract.tronWeb.fullNode || typeof contract.tronWeb.fullNode.host !== 'string') {
          if (!contract.tronWeb.fullNode) {
            contract.tronWeb.fullNode = {};
          }
          Object.defineProperty(contract.tronWeb.fullNode, 'host', {
            value: String(fullNodeUrl),
            writable: true,
            enumerable: true,
            configurable: true,
          });
        }
      }
      
      // Final verification with detailed logging
      const verifyHost = (node, name) => {
        if (!node || !node.host || typeof node.host !== 'string') {
          console.error(`Node ${name} verification failed:`, {
            exists: !!node,
            hasHost: !!node?.host,
            hostType: typeof node?.host,
            hostValue: node?.host,
          });
          return false;
        }
        return true;
      };
      
      if (!verifyHost(methodCall.tronWeb?.fullNode, 'methodCall.tronWeb.fullNode')) {
        throw new Error('Failed to configure TronWeb fullNode.host. Please refresh the page and ensure TronLink is connected to Shasta testnet.');
      }
      
      // Double-check: Try to access host to ensure it's readable
      try {
        const testHost = methodCall.tronWeb.fullNode.host;
        if (!testHost || typeof testHost !== 'string') {
          throw new Error('fullNode.host is not accessible as a string');
        }
      } catch (verifyErr) {
        console.error('Host verification failed:', verifyErr);
        throw new Error('TronWeb node configuration is invalid. Please refresh the page.');
      }
      
      // Send transaction with feeLimit (100 TRX = 100,000,000 SUN)
      const sendOptions = {
        feeLimit: 100000000,
        callValue: 0,
      };
      
      const result = await methodCall.send(sendOptions);
      
      // Extract transaction hash
      let transactionHash;
      if (typeof result === 'string') {
        transactionHash = result;
      } else if (result && result.txid) {
        transactionHash = result.txid;
      } else if (result && typeof result === 'object') {
        transactionHash = result.transaction?.txID || result.transactionHash || result.hash || result;
      } else {
        transactionHash = result;
      }
      
      return {
        hash: transactionHash,
        wait: async () => {
          // Poll for transaction confirmation
          const checkInterval = 3000;
          const maxAttempts = 60;
          let attempts = 0;
          
          while (attempts < maxAttempts) {
            try {
              const tx = await tronWeb.trx.getTransaction(transactionHash);
              if (tx && tx.ret && tx.ret[0] && tx.ret[0].contractRet) {
                if (tx.ret[0].contractRet === 'SUCCESS') {
                  return { status: 1, transactionHash };
                } else if (tx.ret[0].contractRet === 'REVERT' || tx.ret[0].contractRet === 'OUT_OF_TIME') {
                  throw new Error(`Transaction reverted: ${tx.ret[0].contractRet}`);
                }
              }
              await new Promise(resolve => setTimeout(resolve, checkInterval));
              attempts++;
            } catch (err) {
              if (err.message && err.message.includes('reverted')) {
                throw err;
              }
              await new Promise(resolve => setTimeout(resolve, checkInterval));
              attempts++;
            }
          }
          
          throw new Error('Transaction confirmation timeout');
        },
      };
    } catch (err) {
      // Detailed error logging for debugging
      console.error(`Error sending ${method} on Tron:`, err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        method: method,
        params: convertedParams,
        methodCallExists: typeof methodCall !== 'undefined',
        methodCallTronWeb: methodCall ? !!methodCall.tronWeb : false,
        methodCallFullNode: methodCall ? !!methodCall.tronWeb?.fullNode : false,
        methodCallFullNodeHost: methodCall?.tronWeb?.fullNode?.host || 'N/A',
        tronWebReady: tronWeb?.ready,
        tronWebDefaultAddress: tronWeb?.defaultAddress?.base58,
      });
      
      // User-friendly error messages
      let errorMessage = err.message || err.toString();
      
      if (errorMessage.includes('toLowerCase')) {
        errorMessage = 'Network configuration error. Please refresh the page and ensure TronLink is connected to Shasta testnet.';
      } else if (errorMessage.includes('User denied') || errorMessage.includes('User rejected')) {
        errorMessage = 'Transaction was rejected. Please approve in TronLink to continue.';
      } else if (errorMessage.includes('insufficient') || errorMessage.includes('balance')) {
        errorMessage = 'Insufficient TRX balance for transaction fees. Please add TRX to your wallet.';
      } else if (errorMessage.includes('revert') || errorMessage.includes('REVERT')) {
        errorMessage = 'Transaction reverted. The contract may have rejected the transaction (e.g., cooldown period, insufficient allowance).';
      } else {
        errorMessage = `Transaction failed: ${errorMessage}`;
      }
      
      throw new Error(errorMessage);
    }
  } else {
    // Ethereum transactions
    if (!contract || !contract[method]) {
      throw new Error(`Method ${method} not found on contract`);
    }
    return await contract[method](...params);
  }
};

/**
 * Watch token in wallet (MetaMask for Ethereum)
 */
export const watchTokenInMetaMask = async (network = NETWORKS.ETHEREUM) => {
  if (network !== NETWORKS.ETHEREUM) {
    return { success: false, error: 'Token watching only available for Ethereum network' };
  }
  
  if (!window.ethereum) {
    return { success: false, error: 'MetaMask is not installed' };
  }
  
  const addresses = getContractAddresses(network);
  if (!addresses.token) {
    return { success: false, error: 'Token contract address not available' };
  }
  
  try {
    const decimals = 6;
    
    // Create SVG logo as data URI - this ensures it works even if the file isn't accessible
    // Using the same logo as our app (USDTP logo with green gradient background)
    const svgLogo = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="12" fill="#26A17B"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M13 7C13 6.44772 12.5523 6 12 6C11.4477 6 11 6.44772 11 7V7.10139C9.40464 7.43925 8.375 8.58587 8.375 10C8.375 11.4141 9.40463 12.5607 11 12.8986V14.789C10.5435 14.595 10.219 14.3039 10.2015 14.2873C9.81056 13.9024 9.18159 13.9042 8.79293 14.2929C8.4024 14.6834 8.40239 15.3166 8.79291 15.7071C9.05517 15.969 9.37099 16.1852 9.69138 16.3682C10.0315 16.5626 10.4745 16.7635 11 16.8851V17C11 17.5523 11.4477 18 12 18C12.5523 18 13 17.5523 13 17V16.8986C14.5954 16.5607 15.625 15.4141 15.625 14C15.625 12.5859 14.5954 11.4393 13 11.1014V9.16492C13.4727 9.339 13.6825 9.58115 13.7085 9.61119C14.0401 10.0402 14.6562 10.1281 15.0944 9.80419C15.5385 9.47592 15.6325 8.84977 15.3042 8.40562C15.3042 8.40562 15.3047 8.40635 15.3035 8.40472C15.2396 8.31864 15.1726 8.24151 15.0527 8.1254C14.9108 7.98796 14.707 7.81664 14.4357 7.64913C14.0715 7.42421 13.5949 7.21225 13 7.0949V7ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12Z" fill="#ffffff"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M13.1252 13.2457C13.0682 13.2126 13 13.2562 13 13.3222V14.6779C13 14.7439 13.0682 14.7875 13.1252 14.7543V14.7543C13.52 14.5248 13.6249 14.19 13.6249 14C13.6249 13.8101 13.52 13.4752 13.1252 13.2457V13.2457Z" fill="#ffffff"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M11 9.33969C11 9.26548 10.9233 9.21647 10.8597 9.25462V9.25462C10.4773 9.48379 10.375 9.81251 10.375 10C10.375 10.1875 10.4773 10.5162 10.8597 10.7454V10.7454C10.9233 10.7835 11 10.7345 11 10.6603V9.33969Z" fill="#ffffff"/>
    </svg>`;
    
    // Convert SVG to data URI (base64 encoded)
    const svgBase64 = btoa(unescape(encodeURIComponent(svgLogo)));
    const image = `data:image/svg+xml;base64,${svgBase64}`;
    
    // Get token symbol and name from contract
    let symbol = 'USDTP';
    let tokenName = 'USDTP Token';
    
    // Try to get actual symbol and name from contract using provider
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const tokenContract = new ethers.Contract(addresses.token, TOKEN_ABI, provider);
      
      // Fetch symbol and name from contract (these are view functions, don't need signer)
      const [contractSymbol, contractName] = await Promise.all([
        tokenContract.symbol().catch(() => 'USDTP'),
        tokenContract.name().catch(() => 'USDTP Token'),
      ]);
      
      symbol = contractSymbol || 'USDTP';
      tokenName = contractName || 'USDTP Token';
    } catch (e) {
      // Use defaults if contract call fails
      console.log('Could not fetch token info from contract, using defaults:', e);
    }
    
    const wasAdded = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: addresses.token,
          decimals: decimals,
          symbol: symbol,
          image: image,
        },
      },
    });
    
    if (wasAdded === null || wasAdded === false) {
      return { success: false, error: 'User cancelled or request failed' };
    }
    
    return { success: true };
  } catch (err) {
    console.error('watchAsset failed', err);
    return { success: false, error: err.message || 'Failed to add token' };
  }
};
