import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getFaucetContract, getTokenContract, formatTokenAmount, parseTokenAmount, watchTokenInMetaMask, callContractMethod, sendContractTransaction, getContractAddresses } from '../utils/contracts';
import { useWallet } from '../hooks/useWallet';
import { useNetwork } from '../hooks/useNetwork';
import { USDTSVG } from './SVGLogos';
import Transfer from './Transfer';

const Faucet = () => {
  const { network } = useNetwork();
  const { account, signer, chainId } = useWallet();
  const [balance, setBalance] = useState('0');
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [maxAmount, setMaxAmount] = useState('0');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [cooldown, setCooldown] = useState(60); // Default cooldown in seconds
  const [contractErrorShown, setContractErrorShown] = useState(false);

  useEffect(() => {
    if (account && signer) {
      loadData();
      
      // Update user info every 5 seconds (only if contracts are working)
      // Note: contractErrorShown is checked inside, not in dependency array to avoid re-creating interval
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
    } else {
      // Reset error flag when disconnected
      setContractErrorShown(false);
    }
  }, [account, signer, network]);

  const loadData = async () => {
    if (!account || !signer) return;
    
    try {
      const contractSigner = signer;
      const tokenContract = getTokenContract(contractSigner, network);
      
      // Check if contract is available
      if (!tokenContract) {
        if (!contractErrorShown) {
          setContractErrorShown(true);
          // Use warn instead of error since this is expected when contracts aren't deployed
          console.warn('Token contract not available. Contracts may not be deployed on this network.');
        }
        setBalance('0');
        setMaxAmount('0');
        setUserInfo({
          timeUntilNext: 0,
          claimedToday: '0',
          remaining: '0',
          requests: 0,
        });
        return;
      }
      
      // Get balance
      let tokenBalance;
      try {
        tokenBalance = await callContractMethod(tokenContract, 'balanceOf', [account], network);
        setBalance(formatTokenAmount(tokenBalance));
      } catch (err) {
        if (err.message?.includes('Contract not found') || err.message?.includes('not deployed')) {
          if (!contractErrorShown) {
            setContractErrorShown(true);
            console.error('Contract not found. Error:', err.message);
            // Don't show toast - the banner will display the info
          }
          setBalance('0');
        } else {
          console.error('Error loading balance:', err);
          setBalance('0');
        }
      }

      // Get faucet info (only if token contract worked)
      if (!contractErrorShown) {
        try {
          const faucetContract = getFaucetContract(contractSigner, network);
          if (!faucetContract) {
            if (!contractErrorShown) {
              setContractErrorShown(true);
              // Use warn instead of error since this is expected when contracts aren't deployed
              console.warn('Faucet contract not available. Contracts may not be deployed on this network.');
            }
            setMaxAmount('0');
          } else {
            const [maxRequestAmount, requestCooldown] = await Promise.all([
              callContractMethod(faucetContract, 'maxRequestAmount', [], network),
              callContractMethod(faucetContract, 'requestCooldown', [], network),
            ]);
            
            setMaxAmount(formatTokenAmount(maxRequestAmount));
            setCooldown(Number(requestCooldown));
          }
        } catch (err) {
          if (err.message?.includes('Contract not found') || err.message?.includes('not deployed')) {
            if (!contractErrorShown) {
              setContractErrorShown(true);
              // Error already logged, don't show toast since we have the banner now
            }
            setMaxAmount('0');
          } else {
            console.error('Error loading faucet info:', err);
            setMaxAmount('0');
          }
        }
      }

      // Only load user info if contracts are working (will be called by interval if not)
      if (!contractErrorShown) {
        await loadUserInfo();
      } else {
        // If contract error, set default user info
        setUserInfo({
          timeUntilNext: 0,
          claimedToday: '0',
          remaining: '0',
          requests: 0,
        });
      }
    } catch (err) {
      console.error('Error loading data:', err);
      // Don't show error toast here, already handled above
    }
  };

  const loadUserInfo = async () => {
    if (!account || !signer) return;

    try {
      const contractSigner = signer;
      const faucetContract = getFaucetContract(contractSigner, network);
      
      if (!faucetContract) {
        setUserInfo({
          timeUntilNext: 0,
          claimedToday: '0',
          remaining: '0',
          requests: 0,
        });
        return;
      }
      
      // Ethereum returns tuples with 4 values
      const result = await callContractMethod(faucetContract, 'getUserInfo', [account], network);
      
      // Ethereum: [timeUntilNextRequest, claimedToday, remainingCap, requestCount]
      let timeUntilNext, claimedToday, remaining, requests;
      
      if (Array.isArray(result)) {
        timeUntilNext = result[0];
        claimedToday = result[1];
        remaining = result[2];
        requests = result[3] || 0;
      } else {
        timeUntilNext = result.timeUntilNext || result.timeUntilNextRequest || result[0] || 0;
        claimedToday = result.claimedToday || result[1] || 0;
        remaining = result.remaining || result.remainingCap || result[2] || 0;
        requests = result.requests || result.requestCount || result[3] || 0;
      }
      
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
      // Only log if not a contract not found error (to reduce noise)
      if (!err.message?.includes('Contract not found')) {
        console.error('Error loading user info:', err);
      }
      // Set default values if contract not found
      if (err.message?.includes('Contract not found')) {
        setUserInfo({
          timeUntilNext: 0,
          claimedToday: '0',
          remaining: '0',
          requests: 0,
        });
      }
    }
  };

  const handleRequest = async () => {
    if (!account || !signer) {
      toast.error('Please connect your wallet');
      return;
    }

    if (contractErrorShown) {
      toast.error('Contracts are not deployed on this network. Please switch networks or deploy contracts.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const parsedAmount = parseTokenAmount(amount);
      const contractSigner = signer;
      const faucetContract = getFaucetContract(contractSigner, network);

      const txToast = toast.loading('Transaction pending...', {
        icon: '⏳',
      });

      // Use unified transaction sending
      const methodName = 'requestFlash';
      const tx = await sendContractTransaction(
        faucetContract,
        methodName,
        [parsedAmount],
        network
      );
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      toast.success(`Success! You received ${amount} USDTP`, {
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
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      
      let errorMessage = 'Transaction failed';
      
      const errMsg = err.message || err.toString();
      if (errMsg.includes('request too soon')) {
        errorMessage = 'Please wait for the cooldown period';
      } else if (errMsg.includes('exceeds max request amount')) {
        errorMessage = `Maximum request amount is ${maxAmount} USDTP`;
      } else if (errMsg.includes('exceeds daily cap')) {
        errorMessage = 'You have exceeded your daily limit';
      } else if (errMsg.includes('user rejected') || errMsg.includes('User denied') || errMsg.includes('rejected')) {
        errorMessage = 'Transaction rejected. Please approve in MetaMask to continue.';
      } else if (errMsg.includes('REVERT')) {
        errorMessage = 'Transaction reverted. Please check your balance and try again.';
      } else if (errMsg.includes('toLowerCase') || errMsg.includes('network configuration')) {
        errorMessage = 'Network configuration error. Please refresh the page and try again.';
      } else if (errMsg.includes('insufficient') || errMsg.includes('balance')) {
        errorMessage = 'Insufficient ETH balance for transaction fees. Please add ETH to your wallet.';
      } else {
        errorMessage = errMsg.length > 100 ? 'Transaction failed. Please check the console for details.' : errMsg;
      }
      
      toast.error(errorMessage, {
        duration: 5000,
      });
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
    <div className="space-y-4 sm:space-y-6">
      {/* Contract Not Deployed Warning */}
      {contractErrorShown && (
        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-yellow-400 font-semibold text-xs sm:text-sm mb-1">
                Network Mismatch
              </h4>
              <p className="text-yellow-300/80 text-xs mb-2">
                Contracts are deployed on <span className="font-bold text-yellow-400">Sepolia Testnet</span>, but you're connected to <span className="font-bold">{network}</span> network.
              </p>
              <>
                  <div className="text-xs text-yellow-300/60 space-y-1 font-mono bg-slate-900/50 p-2 rounded-lg mb-2 break-all">
                    {(() => {
                      const addresses = getContractAddresses('ethereum');
                      return (
                        <>
                          <p className="truncate">Token: {addresses.token || 'Not set'}</p>
                          <p className="truncate">Faucet: {addresses.faucet || 'Not set'}</p>
                        </>
                      );
                    })()}
                  </div>
                  <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-2 sm:p-2.5 mt-2">
                    <p className="text-blue-300 text-xs font-medium mb-1">✅ Solution:</p>
                    <p className="text-blue-200/80 text-xs mb-2">
                      Switch your MetaMask to <span className="font-bold">Sepolia Testnet</span> (Chain ID: 11155111) to interact with the deployed contracts.
                    </p>
                    {chainId && (
                      <p className="text-blue-200/60 text-xs font-mono break-all">
                        Current Chain ID: {chainId} {chainId === 11155111 ? '✓ Sepolia' : chainId === 1 ? '(Mainnet)' : chainId === 1337 ? '(Localhost)' : ''}
                      </p>
                    )}
                  </div>
              </>
            </div>
          </div>
        </div>
      )}

      {/* Balance Card - Dark Theme */}
      <div className={`bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border border-slate-700 ${contractErrorShown ? 'opacity-50' : ''}`}>
        <div className="text-center">
          <div className="flex justify-center mb-2 sm:mb-3 md:mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg overflow-hidden bg-gradient-to-br from-[#26A17B] to-[#1e8a6a]">
              <USDTSVG className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16" />
            </div>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mb-2 sm:mb-3 font-medium">Total Balance</p>
          <div className="flex items-baseline justify-center gap-1 sm:gap-1.5 md:gap-2 flex-wrap px-2">
            <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white break-all">{balance}</span>
            <span className="text-lg sm:text-xl md:text-2xl text-slate-300 font-medium">USDTP</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <button 
          className="bg-gradient-to-br from-blue-900/30 to-blue-800/40 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg border border-blue-700/50 hover:border-blue-600 hover:shadow-xl transition-all active:scale-95"
          onClick={() => document.getElementById('request-section')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mx-auto mb-2 sm:mb-3 flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
            </svg>
          </div>
          <p className="text-white font-semibold text-xs sm:text-sm">Request</p>
          <p className="text-slate-400 text-xs mt-0.5 hidden sm:block">Get Tokens</p>
        </button>
        <button 
          className="bg-gradient-to-br from-green-900/30 to-emerald-800/40 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg border border-green-700/50 hover:border-green-600 hover:shadow-xl transition-all active:scale-95"
          onClick={() => document.getElementById('transfer-section')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mx-auto mb-2 sm:mb-3 flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </div>
          <p className="text-white font-semibold text-xs sm:text-sm">Transfer</p>
          <p className="text-slate-400 text-xs mt-0.5 hidden sm:block">Send Tokens</p>
        </button>
        <button 
          className="bg-gradient-to-br from-purple-900/30 to-purple-800/40 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg border border-purple-700/50 hover:border-purple-600 hover:shadow-xl transition-all active:scale-95 group col-span-2 sm:col-span-1"
          onClick={async () => {
            if (!window.ethereum) {
              toast.error('MetaMask is not installed. Please install MetaMask first.');
              return;
            }
            
            try {
              const result = await watchTokenInMetaMask(network);
              if (result.success) {
                toast.success('USDTP successfully added to your wallet!');
              } else {
                // Don't show error if user cancelled
                if (result.error && !result.error.includes('cancelled')) {
                  toast.error(result.error || 'Could not add token. Please try again.');
                }
              }
            } catch (error) {
              console.error('Error adding token:', error);
              toast.error('Failed to add token to wallet.');
            }
          }}
        >
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 mx-auto mb-2 sm:mb-3 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-white font-semibold text-xs sm:text-sm">Add to Wallet</p>
          <p className="text-slate-400 text-xs mt-0.5 hidden sm:block">Import USDTP</p>
        </button>
      </div>

      {/* Request Card */}
      <div id="request-section" className="bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-700">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
            </svg>
          </div>
          <h3 className="text-white font-semibold text-base sm:text-lg">Request Tokens</h3>
        </div>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-gray-600 text-xs sm:text-sm mb-1.5 sm:mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={maxAmount}
              min="1"
              step="1"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900 border border-slate-600 rounded-lg sm:rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="Enter amount"
            />
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-green-800">
              ✅ {success}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-red-800">
              ❌ {error}
            </div>
          )}

          {timeRemaining > 0 && (
            <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-slate-900/50 rounded-lg sm:rounded-xl border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-xs sm:text-sm font-medium">Cooldown Progress</span>
                <span className="text-white text-xs sm:text-sm font-bold">{formatTime(timeRemaining)}</span>
              </div>
              <div className="w-full h-1.5 sm:h-2 bg-slate-700 rounded-full overflow-hidden">
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
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Processing...</span>
                <span className="sm:hidden">Processing</span>
              </div>
            ) : timeRemaining > 0 ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Wait {formatTime(timeRemaining)}</span>
              </div>
            ) : (
              <>
                <span className="hidden sm:inline">Request Tokens</span>
                <span className="sm:hidden">Request</span>
              </>
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
