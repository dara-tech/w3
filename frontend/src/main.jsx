import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Filter out deprecation warnings from wallet extensions (MetaMask/TronLink)
// These warnings come from injected scripts and are not errors in our code
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    // Suppress deprecation warnings and recommendations from wallet extensions
    const message = typeof args[0] === 'string' ? args[0] : String(args[0] || '');
    const fullMessage = args.map(arg => String(arg || '')).join(' ');
    
    // Filter out TronLink deprecation warnings
    if (
      message.includes('tabReply') ||
      fullMessage.includes('tabReply') ||
      (message.includes('Deprecation') && message.includes('will be removed')) ||
      (fullMessage.includes('Deprecation') && fullMessage.includes('will be removed')) ||
      (message.includes('TronLink') && message.includes('recommend') && message.includes('tron_requestAccounts')) ||
      (fullMessage.includes('TronLink') && fullMessage.includes('recommend')) ||
      (message.includes('injected.js') && message.includes('Deprecation')) ||
      (fullMessage.includes('injected.js') && (fullMessage.includes('Deprecation') || fullMessage.includes('tabReply')))
    ) {
      return; // Suppress these warnings
    }
    // Allow all other warnings
    originalWarn.apply(console, args);
  };

  // Also filter console.error for similar deprecation warnings
  const originalError = console.error;
  console.error = (...args) => {
    const message = typeof args[0] === 'string' ? args[0] : String(args[0] || '');
    const fullMessage = args.map(arg => String(arg || '')).join(' ');
    
    // Suppress deprecation warnings from wallet extensions
    if (
      message.includes('tabReply') ||
      fullMessage.includes('tabReply') ||
      (message.includes('Deprecation') && message.includes('will be removed')) ||
      (fullMessage.includes('Deprecation') && fullMessage.includes('will be removed')) ||
      (message.includes('injected.js') && message.includes('Deprecation')) ||
      (fullMessage.includes('injected.js') && (fullMessage.includes('Deprecation') || fullMessage.includes('tabReply')))
    ) {
      return; // Suppress these warnings
    }
    // Allow all other errors
    originalError.apply(console, args);
  };
  
  // Also filter console.log for TronLink initialization spam
  const originalLog = console.log;
  console.log = (...args) => {
    const message = typeof args[0] === 'string' ? args[0] : String(args[0] || '');
    const fullMessage = args.map(arg => String(arg || '')).join(' ');
    
    // Suppress TronLink initialization messages
    if (
      (message.includes('Provider initialised') && fullMessage.includes('injected.js')) ||
      (fullMessage.includes('Provider initialised') && fullMessage.includes('injected.js')) ||
      (message.includes('Received new node') && fullMessage.includes('injected.js')) ||
      (fullMessage.includes('Received new node') && fullMessage.includes('injected.js')) ||
      (message.includes('TronLink initiated') && fullMessage.includes('injected.js')) ||
      (fullMessage.includes('TronLink initiated') && fullMessage.includes('injected.js'))
    ) {
      return; // Suppress these logs
    }
    // Allow all other logs
    originalLog.apply(console, args);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
