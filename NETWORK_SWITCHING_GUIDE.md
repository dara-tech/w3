# Network Switching System - Complete Guide

## Overview

This application now supports seamless switching between **Ethereum** and **Tron** networks with a unified, consistent API. All components automatically adapt to the selected network.

## 🎯 Key Features

- ✅ **Unified API** - Same code works for both Ethereum and Tron
- ✅ **Automatic Network Detection** - Detects and uses appropriate wallet (MetaMask/TronLink)
- ✅ **Consistent UI** - Network selector in header, same interface for both networks
- ✅ **Smart Address Handling** - Automatically converts between base58 (Tron) and hex formats
- ✅ **Error Handling** - Comprehensive error messages for both networks
- ✅ **Transaction Management** - Unified transaction sending and confirmation waiting

## 📁 Architecture

### Core Files

1. **`frontend/src/utils/network.js`**
   - Network constants and configuration
   - Address validation and formatting
   - Network utility functions

2. **`frontend/src/hooks/useNetwork.jsx`**
   - Network state management (React Context)
   - Network switching logic
   - Persistent storage (localStorage)

3. **`frontend/src/hooks/useWallet.jsx`**
   - Unified wallet connection for both networks
   - Auto-detects MetaMask (Ethereum) or TronLink (Tron)
   - Provides consistent interface regardless of network

4. **`frontend/src/utils/contracts.js`**
   - Unified contract interaction API
   - Handles both ethers.js (Ethereum) and TronWeb (Tron)
   - Automatic address format conversion

5. **`frontend/src/components/NetworkSelector.jsx`**
   - UI component for network switching
   - Validates wallet installation before switching

## 🚀 How It Works

### Network Selection

1. User clicks network selector (Ethereum/Tron)
2. System validates wallet installation for target network
3. Network preference saved to localStorage
4. Page reloads to ensure clean state
5. All components automatically use new network

### Wallet Connection

**Ethereum (MetaMask):**
- Checks for `window.ethereum`
- Uses `eth_requestAccounts` to connect
- Creates ethers.js provider and signer

**Tron (TronLink):**
- Checks for `window.tronWeb`
- Uses TronLink's automatic connection
- Uses TronWeb instance directly as signer

### Contract Interactions

**Unified API:**
```javascript
// Works for both networks
const contract = getTokenContract(signer, network);
const balance = await callContractMethod(contract, 'balanceOf', [account], network);
const tx = await sendContractTransaction(contract, 'transfer', [to, amount], network);
```

**Under the Hood:**
- **Ethereum:** Uses ethers.js Contract directly
- **Tron:** Uses TronWeb contract API with `.call()` and `.send()`
- **Address Conversion:** Automatically converts base58 ↔ hex as needed

## 📝 Usage Examples

### Switching Networks

```javascript
import { useNetwork } from './hooks/useNetwork';

const MyComponent = () => {
  const { network, switchNetwork } = useNetwork();
  
  // Network will be 'ethereum' or 'tron'
  console.log('Current network:', network);
  
  // Switch network (will reload page)
  switchNetwork('tron');
};
```

### Using Wallet

```javascript
import { useWallet } from './hooks/useWallet';

const MyComponent = () => {
  const { account, signer, tronWeb, network, connectWallet } = useWallet();
  
  // For Ethereum: signer is ethers Signer
  // For Tron: signer is TronWeb instance, also available as tronWeb
  
  if (network === 'ethereum') {
    // Use signer (ethers Signer)
  } else {
    // Use tronWeb (TronWeb instance)
  }
};
```

### Contract Calls

```javascript
import { getTokenContract, callContractMethod } from './utils/contracts';
import { useWallet } from './hooks/useWallet';
import { useNetwork } from './hooks/useNetwork';

const MyComponent = () => {
  const { network } = useNetwork();
  const { signer, tronWeb } = useWallet();
  
  const contractSigner = network === 'tron' ? tronWeb : signer;
  const contract = getTokenContract(contractSigner, network);
  
  // Unified API - works for both
  const balance = await callContractMethod(
    contract,
    'balanceOf',
    [account],
    network
  );
};
```

## 🔧 Configuration

### Contract Addresses

Contract addresses are stored in `contracts.js`:

```javascript
export let CONTRACT_ADDRESSES = {
  ethereum: {
    token: '0x...',
    faucet: '0x...',
  },
  tron: {
    token: 'T...',  // or '41...' (will be converted)
    faucet: 'T...',
  },
};
```

You can also load from `/deployment-info.json`:

```json
{
  "contracts": {
    "FlashToken": "0x...",
    "FlashFaucetSecure": "0x..."
  },
  "tron": {
    "contracts": {
      "FlashToken": "T...",
      "FlashFaucetSecure": "T..."
    }
  }
}
```

### Network Settings

Configure in `utils/network.js`:

```javascript
export const NETWORK_CONFIG = {
  ethereum: {
    name: 'Ethereum',
    chainId: '0x1',
    explorer: 'https://etherscan.io',
    // ...
  },
  tron: {
    name: 'Tron',
    explorer: 'https://tronscan.org',
    // ...
  },
};
```

## 🛠️ Development

### Adding a New Component

1. Import hooks:
```javascript
import { useNetwork } from '../hooks/useNetwork';
import { useWallet } from '../hooks/useWallet';
```

2. Get network and wallet:
```javascript
const { network } = useNetwork();
const { account, signer, tronWeb } = useWallet();
```

3. Use unified contract API:
```javascript
const contractSigner = network === 'tron' ? tronWeb : signer;
const contract = getContract(contractSigner, network);
```

### Adding a New Network

1. Add to `NETWORKS` constant in `utils/network.js`
2. Add configuration to `NETWORK_CONFIG`
3. Update `useWallet.jsx` to handle new wallet type
4. Update contract utilities if needed
5. Add network option to `NetworkSelector`

## ⚠️ Important Notes

### Tron Addresses

- **Display Format:** Base58 (T...)
- **Contract Calls:** Automatically converted to hex (41...)
- **Storage:** Can use either format, conversion is automatic

### Transaction Confirmation

- **Ethereum:** Uses `tx.wait()` (ethers.js)
- **Tron:** Polls transaction status until confirmed
- Both provide consistent `{ transactionHash }` receipt

### Error Messages

- Network-specific error handling
- User-friendly messages
- Automatic detection of rejection/revert

## 🐛 Troubleshooting

### "TronLink is not installed"
- Install TronLink browser extension
- Refresh page after installation

### "MetaMask is not installed"
- Install MetaMask browser extension
- Refresh page after installation

### Contract calls failing on Tron
- Ensure contract addresses are correct
- Check if contracts are deployed on Tron network
- Verify TronLink is connected to correct network (mainnet/testnet)

### Address validation errors
- Tron addresses must start with `T` (base58) or `41` (hex)
- Ethereum addresses must be `0x` followed by 40 hex chars
- System automatically validates based on network

## 📚 Resources

- [TronWeb Documentation](https://developers.tron.network/docs/tronweb-introduction)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [MetaMask Docs](https://docs.metamask.io/)
- [TronLink Docs](https://www.tronlink.org/)

## 🎉 Summary

The network switching system provides:

1. **Seamless Experience** - Users switch networks with one click
2. **Developer Friendly** - Unified API reduces code duplication
3. **Robust** - Handles edge cases and network differences automatically
4. **Extensible** - Easy to add more networks in the future

All components now work consistently across both Ethereum and Tron networks!

