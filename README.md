# Flash USDT Simulator

Educational Flash-USDT simulator for testing on testnets. This project demonstrates a secure flash loan faucet system built with Solidity smart contracts and a React frontend.

## Features

- **Flash Token (USDT-like)**: ERC20 token implementation for testing
- **Flash Faucet Secure**: Secure flash loan faucet with anti-flash loan attack mechanisms
- **React Frontend**: Modern web interface for interacting with the contracts
- **Hardhat Integration**: Complete development and testing environment

## Project Structure

```
├── contracts/           # Solidity smart contracts
├── frontend/           # React frontend application
├── scripts/            # Deployment scripts
├── test/               # Contract tests
└── hardhat.config.js   # Hardhat configuration
```

## Contracts

### FlashToken.sol
ERC20 token implementation with standard transfer functions.

### FlashFaucetSecure.sol
Secure flash loan faucet that:
- Implements anti-flash loan attack protections
- Uses ReentrancyGuard for security
- Includes comprehensive access controls

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dara-tech/w3.git
cd w3
```

2. Install dependencies:
```bash
npm install
cd frontend
npm install
cd ..
```

3. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your configuration
```

### Development

Compile contracts:
```bash
npm run compile
```

Run tests:
```bash
npm run test
```

Start local Hardhat node:
```bash
npm run node
```

Deploy to local network:
```bash
npm run deploy:local
```

Run frontend development server:
```bash
npm run frontend:dev
```

### Deployment

Deploy to Sepolia testnet:
```bash
npm run deploy:sepolia
```

## License

MIT

## Keywords

ethereum, smart-contracts, web3, faucet, education

