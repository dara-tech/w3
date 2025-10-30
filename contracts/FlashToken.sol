// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title FlashToken
 * @notice Production-ready ERC-20 token for Flash USDT
 * @dev Secured with OpenZeppelin contracts and rate limiting
 * 
 * Security Features:
 * - Reentrancy protection
 * - Pausable for emergencies
 * - Ownable with transferable ownership
 * - Max supply cap
 * - Minting controlled through faucet
 */
contract FlashToken is ERC20, Ownable, Pausable, ReentrancyGuard {
    
    // Decimals override (USDT uses 6 decimals)
    uint8 private constant _decimals = 6;
    
    // Maximum supply (1 billion tokens)
    uint256 public immutable MAX_SUPPLY = 1000000000 * 10**6; // 1 billion with 6 decimals
    
    // Total minted so far
    uint256 public totalMinted;
    
    // Faucet contract that can mint (controlled minting)
    address public faucetContract;
    
    // Events
    event FaucetContractSet(address indexed faucet);
    event Mint(address indexed to, uint256 amount);
    event MaxSupplyCap(uint256 cap);
    
    /**
     * @dev Constructor sets up the token
     * @param name Name of the token
     * @param symbol Symbol of the token
     */
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {
        emit MaxSupplyCap(MAX_SUPPLY);
    }
    
    /**
     * @dev Mint tokens (only by faucet contract)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint (in smallest unit, 6 decimals)
     */
    function mint(address to, uint256 amount) external whenNotPaused nonReentrant {
        require(msg.sender == faucetContract, "FlashToken: only faucet can mint");
        require(to != address(0), "FlashToken: cannot mint to zero address");
        require(amount > 0, "FlashToken: amount must be greater than zero");
        require(
            totalMinted + amount <= MAX_SUPPLY,
            "FlashToken: mint would exceed max supply"
        );
        
        totalMinted += amount;
        _mint(to, amount);
        
        emit Mint(to, amount);
    }
    
    /**
     * @dev Set the faucet contract that can mint tokens
     * @param _faucet Address of the faucet contract
     */
    function setFaucetContract(address _faucet) external onlyOwner {
        require(_faucet != address(0), "FlashToken: zero address");
        faucetContract = _faucet;
        emit FaucetContractSet(_faucet);
    }
    
    /**
     * @dev Pause all token operations in case of emergency
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Resume normal token operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Burn tokens from caller
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    /**
     * @dev Burn tokens from a specified address
     * @param from Address to burn from
     * @param amount Amount of tokens to burn
     */
    function burnFrom(address from, uint256 amount) external {
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
    }
    
    /**
     * @dev Override update to check if contract is paused
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._update(from, to, amount);
    }
    
    /**
     * @dev Override decimals to return 6 (like USDT)
     */
    function decimals() public pure override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev Get the remaining supply that can be minted
     * @return The amount of tokens that can still be minted
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalMinted;
    }
}

