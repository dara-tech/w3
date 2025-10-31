import { Toaster } from 'react-hot-toast';
import { NetworkProvider, useNetwork } from './hooks/useNetwork';
import { useWallet } from './hooks/useWallet';
import WalletConnect from './components/WalletConnect';
import NetworkSelector from './components/NetworkSelector';
import Faucet from './components/Faucet';
import WelcomeScreen from './components/WelcomeScreen';
import { USDTSVG } from './components/SVGLogos';

function AppContent() {
  const { network } = useNetwork();
  const { account } = useWallet();

  return (
    <>
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          bottom: '20px',
          right: '10px',
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1F2937',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            padding: '12px 16px',
            fontWeight: '500',
            minWidth: '280px',
            maxWidth: 'calc(100vw - 40px)',
            fontSize: '13px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
            duration: 3000,
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
            duration: 5000,
            style: {
              maxWidth: 'calc(100vw - 40px)',
            },
          },
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
        {/* Header - Fixed at top */}
        <header className="sticky top-0 z-50 backdrop-blur-lg bg-slate-900/80 border-b border-slate-800/50">
          <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              {/* Logo & Brand */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#26A17B] to-[#1e8a6a] flex items-center justify-center shadow-lg flex-shrink-0">
                  <USDTSVG className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-white truncate">USDTP Faucet</h1>
                  <p className="text-xs text-slate-400 hidden sm:block">Token Hub</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <NetworkSelector />
                <WalletConnect />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          {account ? (
            <Faucet />
          ) : (
            <WelcomeScreen />
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 sm:mt-16 pb-6 sm:pb-8">
          <div className="max-w-2xl mx-auto px-3 sm:px-4">
            <div className="flex flex-col items-center gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-slate-800/50">
              {/* Network Status */}
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${account ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                <span className="text-slate-400 truncate">
                  {account ? `Connected to ${network}` : 'Not connected'}
                </span>
              </div>
              
              {/* Footer Links */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="hidden sm:inline">Secure & Trusted</span>
                  <span className="sm:hidden">Secure</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="hidden sm:inline">Fast Transactions</span>
                  <span className="sm:hidden">Fast</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="hidden sm:inline">Ethereum Network</span>
                  <span className="sm:hidden">Ethereum</span>
                </div>
              </div>

              {/* Copyright */}
              <p className="text-xs text-slate-600 text-center px-4">
                © 2024 USDTP Faucet. For testing purposes only.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function App() {
  return (
    <NetworkProvider>
      <AppContent />
    </NetworkProvider>
  );
}

export default App;
