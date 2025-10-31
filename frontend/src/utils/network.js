/**
 * Network Management System
 * Ethereum network only
 */

export const NETWORKS = {
  ETHEREUM: 'ethereum',
};

export const NETWORK_CONFIG = {
  ethereum: {
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: '0x1', // Mainnet
    testnetChainId: '0xaa36a7', // Sepolia
    explorer: 'https://etherscan.io',
    testnetExplorer: 'https://sepolia.etherscan.io',
    rpcUrls: [
      'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
      'https://eth.llamarpc.com',
    ],
    testnetRpcUrls: [
      'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
      'https://rpc.sepolia.org',
    ],
  },
};

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = () => {
  return typeof window.ethereum !== 'undefined';
};

/**
 * Format Ethereum address (shortened version)
 */
export const formatAddress = (address) => {
  if (!address) return '';
  if (address.length > 10) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  return address;
};

/**
 * Validate Ethereum address format
 */
export const isValidAddress = (address) => {
  if (!address) return false;
  // Ethereum addresses are 0x followed by 40 hex chars
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

