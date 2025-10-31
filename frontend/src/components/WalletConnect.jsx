import { useWallet } from '../hooks/useWallet';
import { useNetwork } from '../hooks/useNetwork';
import { formatAddress } from '../utils/network';

const WalletConnect = () => {
  const { network } = useNetwork();
  const { account, connectWallet, disconnectWallet, isConnecting, error } = useWallet();

  const displayAddress = account ? formatAddress(account, network) : '';

  if (account) {
    return (
      <button
        onClick={disconnectWallet}
        className="group flex items-center gap-1.5 sm:gap-2 text-xs text-slate-300 hover:text-white bg-slate-800/80 backdrop-blur-sm px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all duration-200 hover:shadow-lg"
        title="Click to disconnect"
      >
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 group-hover:bg-green-300 transition-colors flex-shrink-0"></div>
        <span className="font-medium truncate max-w-[80px] sm:max-w-none">{displayAddress}</span>
        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-600 disabled:to-slate-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-105 active:scale-95 whitespace-nowrap"
      title={error || undefined}
    >
      {isConnecting ? (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="hidden sm:inline">Connecting...</span>
          <span className="sm:hidden">...</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Connect</span>
        </div>
      )}
    </button>
  );
};

export default WalletConnect;
