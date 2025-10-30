import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getTokenContract, formatTokenAmount, parseTokenAmount } from '../utils/contracts';
import { useWallet } from '../hooks/useWallet';

const Transfer = () => {
  const { account, signer } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    if (account && signer) {
      loadBalance();
    }
  }, [account, signer]);

  const loadBalance = async () => {
    if (!account || !signer) return;
    try {
      const tokenContract = getTokenContract(signer);
      const tokenBalance = await tokenContract.balanceOf(account);
      setBalance(formatTokenAmount(tokenBalance));
    } catch (err) {
      console.error('Error loading balance:', err);
    }
  };

  const handleTransfer = async () => {
    if (!account || !signer) {
      setError('Please connect your wallet');
      return;
    }

    if (!recipient || !ethers.isAddress(recipient)) {
      setError('Please enter a valid address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const parsedAmount = parseTokenAmount(amount);
      const tokenContract = getTokenContract(signer);

      const tx = await tokenContract.transfer(recipient, parsedAmount);
      
      setSuccess('Transaction sent! Waiting for confirmation...');
      const receipt = await tx.wait();
      
      setSuccess(`Success! Transferred ${amount} USDT`);
      setRecipient('');
      setAmount('');
      
      await loadBalance();
      
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('Error transferring:', err);
      let errorMessage = 'Transfer failed';
      
      if (err.message.includes('insufficient balance')) {
        errorMessage = 'Insufficient balance';
      } else if (err.message.includes('user rejected')) {
        errorMessage = 'Transaction rejected by user';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return null;
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
        </div>
        <h3 className="text-white font-semibold text-lg">Transfer Tokens</h3>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-slate-300 text-sm mb-2">
            To Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="0x..."
          />
        </div>

        <div>
          <label className="block text-slate-300 text-sm mb-2">
            Amount <span className="text-slate-400">({balance} available)</span>
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.000001"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
            ✅ {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
            ❌ {error}
          </div>
        )}

        <button
          onClick={handleTransfer}
          disabled={loading || !recipient || !amount}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl"
        >
          {loading ? 'Processing...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default Transfer;
