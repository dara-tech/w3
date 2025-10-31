import { NETWORK_CONFIG } from '../utils/network';
import { EthereumSVG } from './SVGLogos';
import { MdOutlineAccountBalanceWallet } from 'react-icons/md';

const NetworkSelector = () => {
  // Only Ethereum network now - no switching needed
  const config = NETWORK_CONFIG.ethereum;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Network Status Badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/40 shadow-md">
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-blue-400 animate-ping opacity-75"></div>
        </div>
        <div className="flex items-center gap-1.5">
          <EthereumSVG className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs text-slate-300 font-medium">{config.name}</span>
        </div>
      </div>
    </div>
  );
};

export default NetworkSelector;
