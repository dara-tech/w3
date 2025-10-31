import { useNetwork } from '../hooks/useNetwork';
import { useWallet } from '../hooks/useWallet';
import { NETWORK_CONFIG } from '../utils/network';
import { USDTSVG } from './SVGLogos';

const WelcomeScreen = () => {
  const { network } = useNetwork();
  const { connectWallet, isConnecting } = useWallet();
  const networkConfig = NETWORK_CONFIG[network];

  return (
    <div className="text-center space-y-6 sm:space-y-8 py-8 sm:py-12 px-2">
      {/* Hero Icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl sm:rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#26A17B] to-[#1e8a6a] flex items-center justify-center shadow-2xl border-2 sm:border-4 border-slate-800">
            <USDTSVG className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 sm:border-4 border-slate-900 flex items-center justify-center">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Title & Description */}
      <div className="space-y-2 sm:space-y-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white px-4">
          Welcome to USDTP Faucet
        </h1>
        <p className="text-slate-400 text-sm sm:text-base md:text-lg max-w-sm mx-auto leading-relaxed px-4">
          Get test tokens on {networkConfig.name} network. Free and secure.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2 sm:pt-4 px-4 sm:px-0">
        <div className="bg-slate-800/50 rounded-lg sm:rounded-xl p-2 sm:p-4 border border-slate-700/50">
          <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1.5 sm:mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-xs sm:text-xs text-slate-400 font-medium">Secure</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg sm:rounded-xl p-2 sm:p-4 border border-slate-700/50">
          <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1.5 sm:mb-2 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-xs sm:text-xs text-slate-400 font-medium">Fast</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg sm:rounded-xl p-2 sm:p-4 border border-slate-700/50">
          <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1.5 sm:mb-2 rounded-full bg-purple-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-xs sm:text-xs text-slate-400 font-medium">Trusted</p>
        </div>
      </div>

      {/* Connect Button */}
      <div className="pt-2 sm:pt-4 px-4">
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-sm sm:text-base"
        >
          <div className="flex items-center justify-center gap-2">
            {isConnecting ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="hidden sm:inline">Connect Wallet to Get Started</span>
                <span className="sm:hidden">Connect Wallet</span>
              </>
            )}
          </div>
        </button>
        <p className="text-slate-500 text-xs sm:text-sm mt-3 sm:mt-4">
          Connect your {networkConfig.name} wallet to request tokens
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;

