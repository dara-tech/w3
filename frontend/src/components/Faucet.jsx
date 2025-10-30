import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { getFaucetContract, getTokenContract, formatTokenAmount, parseTokenAmount, watchTokenInMetaMask } from '../utils/contracts';
import { useWallet } from '../hooks/useWallet';
import Transfer from './Transfer';

const Faucet = () => {
  const { account, signer } = useWallet();
  const [balance, setBalance] = useState('0');
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [maxAmount, setMaxAmount] = useState('0');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [cooldown, setCooldown] = useState(60); // Default cooldown in seconds

  useEffect(() => {
    if (account && signer) {
      loadData();
      
      // Update user info every 5 seconds
      const userInfoInterval = setInterval(() => {
        if (account) loadUserInfo();
      }, 5000);
      
      // Local countdown that syncs with contract data
      const countdownInterval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev > 0) {
            return prev - 1;
          }
          return 0;
        });
      }, 1000);
      
      return () => {
        clearInterval(userInfoInterval);
        clearInterval(countdownInterval);
      };
    }
  }, [account, signer]);

  const loadData = async () => {
    if (!account || !signer) return;
    
    try {
      const tokenContract = getTokenContract(signer);
      const tokenBalance = await tokenContract.balanceOf(account);
      setBalance(formatTokenAmount(tokenBalance));

      const faucetContract = getFaucetContract(signer);
      const [maxRequestAmount, requestCooldown] = await Promise.all([
        faucetContract.maxRequestAmount(),
        faucetContract.requestCooldown(),
      ]);
      setMaxAmount(formatTokenAmount(maxRequestAmount));
      setCooldown(Number(requestCooldown));

      await loadUserInfo();
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const loadUserInfo = async () => {
    if (!account || !signer) return;

    try {
      const faucetContract = getFaucetContract(signer);
      const [timeUntilNext, claimedToday, remaining, requests] = await faucetContract.getUserInfo(account);
      const timeValue = Number(timeUntilNext);
      
      // Only update if the contract value is lower than current to prevent jumping up
      setTimeRemaining((prev) => {
        return timeValue < prev ? timeValue : prev;
      });
      
      setUserInfo({
        timeUntilNext: timeValue,
        claimedToday: formatTokenAmount(claimedToday),
        remaining: formatTokenAmount(remaining),
        requests: Number(requests),
      });
    } catch (err) {
      console.error('Error loading user info:', err);
    }
  };

  const handleRequest = async () => {
    if (!account || !signer) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const parsedAmount = parseTokenAmount(amount);
      const faucetContract = getFaucetContract(signer);

      const tx = await faucetContract.requestFlash(parsedAmount);
      
      const txToast = toast.loading('Transaction pending...', {
        icon: '⏳',
      });
      
      const receipt = await tx.wait();
      
      toast.success(`Success! You received ${amount} FUSDT`, {
        id: txToast,
        duration: 4000,
        icon: (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ),
      });
      
      await loadData();
    } catch (err) {
      console.error('Error requesting flash:', err);
      let errorMessage = 'Transaction failed';
      
      if (err.message.includes('request too soon')) {
        errorMessage = 'Please wait for the cooldown period';
      } else if (err.message.includes('exceeds max request amount')) {
        errorMessage = `Maximum request amount is ${maxAmount} FUSDT`;
      } else if (err.message.includes('exceeds daily cap')) {
        errorMessage = 'You have exceeded your daily limit';
      } else if (err.message.includes('user rejected')) {
        errorMessage = 'Transaction rejected by user';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds <= 0) return 'Now';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  if (!account) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Balance Card - Dark Theme */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-700">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
              <svg className="w-16 h-16" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#26A17B"/>
                <path fill="#FFF" d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"/>
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-sm mb-3 font-medium">Total Balance</p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-6xl font-semibold text-white">{balance}</span>
            <span className="text-2xl text-slate-300 font-medium">FUSDT</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          className="bg-gradient-to-br from-blue-900/30 to-blue-800/40 rounded-2xl p-5 shadow-lg border border-blue-700/50 hover:border-blue-600 hover:shadow-xl transition-all active:scale-95"
          onClick={() => document.getElementById('request-section')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mx-auto mb-3 flex items-center justify-center shadow-md">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
            </svg>
          </div>
          <p className="text-white font-semibold text-sm">Request</p>
          <p className="text-slate-400 text-xs mt-0.5">Get Tokens</p>
        </button>
        <button 
          className="bg-gradient-to-br from-green-900/30 to-emerald-800/40 rounded-2xl p-5 shadow-lg border border-green-700/50 hover:border-green-600 hover:shadow-xl transition-all active:scale-95"
          onClick={() => document.getElementById('transfer-section')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mx-auto mb-3 flex items-center justify-center shadow-md">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </div>
          <p className="text-white font-semibold text-sm">Transfer</p>
          <p className="text-slate-400 text-xs mt-0.5">Send Tokens</p>
        </button>
        <button 
          className="bg-gradient-to-br from-amber-900/30 to-amber-800/40 rounded-2xl p-5 shadow-lg border border-amber-700/50 hover:border-amber-600 hover:shadow-xl transition-all active:scale-95"
          onClick={async () => {
            const added = await watchTokenInMetaMask();
            if (added) {
              toast.success('FUSDT added to MetaMask');
            } else {
              toast.error('Could not add token. Check network and try again.');
            }
          }}
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 mx-auto mb-3 flex items-center justify-center shadow-md">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
            </svg>
          </div>
          <p className="text-white font-semibold text-sm">Add to MetaMask</p>
          <p className="text-slate-400 text-xs mt-0.5">Import FUSDT</p>
        </button>
      </div>

      {/* Request Card */}
      <div id="request-section" className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
            </svg>
          </div>
          <h3 className="text-white font-semibold text-lg">Request Tokens</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-600 text-sm mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={maxAmount}
              min="1"
              step="1"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter amount"
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

          {timeRemaining > 0 && (
            <div className="mb-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm font-medium">Cooldown Progress</span>
                <span className="text-white text-sm font-bold">{formatTime(timeRemaining)}</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((cooldown - timeRemaining) / cooldown) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          <button
            onClick={handleRequest}
            disabled={loading || timeRemaining > 0}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold py-4 px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : timeRemaining > 0 ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Wait {formatTime(timeRemaining)}
              </div>
            ) : (
              'Request Tokens'
            )}
          </button>
        </div>
      </div>

      {/* Transfer Section */}
      <div id="transfer-section">
        <Transfer />
      </div>
    </div>
  );
};

export default Faucet;
