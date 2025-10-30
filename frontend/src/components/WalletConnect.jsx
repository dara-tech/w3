import { useWallet } from '../hooks/useWallet';

const WalletConnect = () => {
  const { account, connectWallet, disconnectWallet, isConnecting } = useWallet();

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (account) {
    return (
      <button
        onClick={disconnectWallet}
        className="text-xs text-gray-600 hover:text-gray-900"
      >
        {formatAddress(account)}
      </button>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:cursor-not-allowed"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
};

export default WalletConnect;
