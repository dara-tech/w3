import { createContext, useContext } from 'react';

const NetworkContext = createContext(null);

export const NetworkProvider = ({ children }) => {
  // Only Ethereum network - no switching needed
  const network = 'ethereum';

  return (
    <NetworkContext.Provider value={{ network }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
};

