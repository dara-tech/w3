import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getTokenContract, formatTokenAmount, parseTokenAmount, callContractMethod, sendContractTransaction } from '../utils/contracts';
import { useWallet } from '../hooks/useWallet';
import { useNetwork } from '../hooks/useNetwork';
import { isValidAddress } from '../utils/network';

const Transfer = () => {
  const { network } = useNetwork();
  const { account, signer } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [balance, setBalance] = useState('0');
  const [contractErrorShown, setContractErrorShown] = useState(false);

  useEffect(() => {
    if (account && signer) {
      loadBalance();
    } else {
      setContractErrorShown(false);
    }
  }, [account, signer, network]);

  const loadBalance = async () => {
    if (!account || !signer) return;
    try {
      const contractSigner = signer;
      const tokenContract = getTokenContract(contractSigner, network);
      
      if (!tokenContract) {
        if (!contractErrorShown) {
          setContractErrorShown(true);
          // Use warn instead of error since this is expected when contracts aren't deployed
          console.warn('Token contract not available. Contracts may not be deployed on this network.');
          toast.error(
            'Token contract not deployed on this network. Please switch networks or deploy contracts.',
            { duration: 8000 }
          );
        }
        setBalance('0');
        return;
      }
      
      const tokenBalance = await callContractMethod(tokenContract, 'balanceOf', [account], network);
      setBalance(formatTokenAmount(tokenBalance));
    } catch (err) {
      if (err.message?.includes('Contract not found') || err.message?.includes('not deployed')) {
        if (!contractErrorShown) {
          setContractErrorShown(true);
          console.error('Contract not found. Error:', err.message);
          toast.error(
            'Token contract not deployed on this network. Please switch networks or deploy contracts.',
            { duration: 8000 }
          );
        }
        setBalance('0');
      } else {
        console.error('Error loading balance:', err);
        toast.error(`Error loading balance: ${err.message}`);
        setBalance('0');
      }
    }
  };

  const handleTransfer = async () => {
    if (!account || !signer) {
      setError('Please connect your wallet');
      toast.error('Please connect your wallet');
      return;
    }

    if (!recipient || !isValidAddress(recipient)) {
      setError('Please enter a valid address');
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const parsedAmount = parseTokenAmount(amount);
      const contractSigner = signer;
      const tokenContract = getTokenContract(contractSigner, network);

      const txToast = toast.loading('Sending transaction...', { icon: '⏳' });
      
      const tx = await sendContractTransaction(
        tokenContract,
        'transfer',
        [recipient, parsedAmount],
        network
      );
      
      toast.loading('Transaction pending...', { id: txToast });
      const receipt = await tx.wait();
      
      toast.success(`Success! Transferred ${amount} USDTP`, { id: txToast });
      setSuccess(`Success! Transferred ${amount} USDTP`);
      setRecipient('');
      setAmount('');
      
      await loadBalance();
      
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('Error transferring:', err);
      let errorMessage = 'Transfer failed';
      
      const errMsg = err.message || err.toString();
      if (errMsg.includes('insufficient balance')) {
        errorMessage = 'Insufficient balance';
      } else if (errMsg.includes('user rejected') || errMsg.includes('User denied')) {
        errorMessage = 'Transaction rejected by user';
      } else if (errMsg.includes('REVERT')) {
        errorMessage = 'Transaction reverted. Please check the recipient address.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return null;
  }

  return (
    <div className="bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-700">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
        </div>
        <h3 className="text-white font-semibold text-base sm:text-lg">Transfer Tokens</h3>
      </div>
      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-slate-300 text-xs sm:text-sm mb-1.5 sm:mb-2">
            To Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900 border border-slate-600 rounded-lg sm:rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs sm:text-sm"
            placeholder="0x..."
          />
        </div>

        <div>
          <label className="block text-slate-300 text-xs sm:text-sm mb-1.5 sm:mb-2">
            Amount <span className="text-slate-400 text-xs">({balance} available)</span>
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.000001"
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900 border border-slate-600 rounded-lg sm:rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            placeholder="0.00"
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

        <button
          onClick={handleTransfer}
          disabled={loading || !recipient || !amount}
          className="w-full bg-gradient-to-r from-green-600 to-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl transition shadow-lg hover:shadow-xl text-sm sm:text-base"
        >
          {loading ? (
            <>
              <span className="hidden sm:inline">Processing...</span>
              <span className="sm:hidden">Processing</span>
            </>
          ) : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default Transfer;
