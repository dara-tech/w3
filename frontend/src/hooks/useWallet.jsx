import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { isMetaMaskInstalled } from '../utils/network';

export const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize Ethereum wallet
  useEffect(() => {
    initializeEthereum();

    return () => {
      // Cleanup listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners?.('accountsChanged');
        window.ethereum.removeAllListeners?.('chainChanged');
      }
    };
  }, []);

  const initializeEthereum = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed');
      return;
    }

    try {
      const providerInstance = new ethers.BrowserProvider(window.ethereum);
      setProvider(providerInstance);

      // Check current chain ID
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      setChainId(parseInt(currentChainId, 16));
      console.log('Connected to chain ID:', parseInt(currentChainId, 16));

      // Check if already connected
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        await handleEthereumAccountsChanged(accounts);
      }

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleEthereumAccountsChanged);
      window.ethereum.on('chainChanged', (newChainId) => {
        setChainId(parseInt(newChainId, 16));
        console.log('Chain changed to:', parseInt(newChainId, 16));
        window.location.reload();
      });
    } catch (err) {
      console.error('Error initializing Ethereum:', err);
      setError(err.message);
    }
  };

  const handleEthereumAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
      setSigner(null);
      setProvider(null);
    } else {
      const account = accounts[0];
      setAccount(account);
      
      try {
        const providerInstance = new ethers.BrowserProvider(window.ethereum);
        const signerInstance = await providerInstance.getSigner();
        setProvider(providerInstance);
        setSigner(signerInstance);
        console.log('Ethereum account changed:', account);
      } catch (err) {
        console.error('Error setting Ethereum signer:', err);
        setError(err.message);
      }
    }
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      await connectEthereum();
    } catch (err) {
      setError(err.message);
      console.error('Error connecting wallet:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const connectEthereum = async () => {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask extension.');
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (accounts.length > 0) {
      await handleEthereumAccountsChanged(accounts);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setProvider(null);
    setError(null);
  };

  return {
    account,
    provider,
    signer,
    chainId,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
  };
};
