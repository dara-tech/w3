import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import WalletConnect from './components/WalletConnect';
import Faucet from './components/Faucet';
import './App.css';

function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1F2937',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            padding: '16px 20px',
            fontWeight: '500',
            minWidth: '320px',
            fontSize: '14px',
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
          },
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-white">USDT</h1>
              <p className="text-slate-400 text-sm">Your wallet</p>
            </div>
            <div>
              <WalletConnect />
            </div>
          </div>

          {/* Main Content */}
          <Faucet />

          {/* Footer */}
          <div className="text-center mt-8 text-slate-500 text-xs">
            <p>Secure & Trusted</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
