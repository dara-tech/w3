// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./FlashToken.sol";

/**
 * @title FlashFaucetSecure
 * @notice Production-ready faucet with enhanced security
 * @dev Features:
 * - Reentrancy protection
 * - Pausable for emergencies
 * - Rate limiting per address
 * - Daily caps per address
 * - Emergency withdraw
 * - Comprehensive events
 */
contract FlashFaucetSecure is Ownable, Pausable, ReentrancyGuard {
    
    // Token contract
    FlashToken public immutable token;
    
    // Rate limiting configuration
    uint256 public requestCooldown; // Seconds between requests
    uint256 public maxRequestAmount; // Maximum tokens per request
    uint256 public dailyCapPerUser; // Maximum tokens per address per day
    uint256 public constant DAY_IN_SECONDS = 86400;
    
    // User tracking
    mapping(address => uint256) public lastRequestTime;
    mapping(address => uint256) public dailyClaimed;
    mapping(address => uint256) public dailyCapResetTime;
    
    // Blacklist for abuse prevention
    mapping(address => bool) public isBlacklisted;
    
    // Statistics
    uint256 public totalRequests;
    uint256 public totalTokensDistributed;
    mapping(address => uint256) public userRequestCount;
    
    // Events
    event FlashRequested(address indexed requester, uint256 amount);
    event FlashGranted(address indexed to, uint256 amount);
    event ConfigurationUpdated(uint256 cooldown, uint256 maxAmount, uint256 dailyCap);
    event BlacklistUpdated(address indexed user, bool isBlacklisted);
    event EmergencyWithdraw(address indexed owner, uint256 amount);
    
    /**
     * @dev Constructor sets up the token and initial configuration
     * @param _token Address of the FlashToken contract
     */
    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "FlashFaucetSecure: zero address");
        token = FlashToken(_token);
        
        // Initial configuration: 5 minutes cooldown, 1000 tokens max per request, 5000 tokens daily cap
        requestCooldown = 300; // 5 minutes
        maxRequestAmount = 1000 * 10**6; // 1000 tokens (6 decimals)
        dailyCapPerUser = 5000 * 10**6; // 5000 tokens per day
        
        emit ConfigurationUpdated(requestCooldown, maxRequestAmount, dailyCapPerUser);
    }
    
    /**
     * @dev Request tokens from the faucet
     * @param amount Amount of tokens to request (in smallest unit, 6 decimals)
     */
    function requestFlash(uint256 amount) external whenNotPaused nonReentrant {
        require(amount > 0, "FlashFaucetSecure: amount must be greater than zero");
        require(amount <= maxRequestAmount, "FlashFaucetSecure: exceeds max request amount");
        require(!isBlacklisted[msg.sender], "FlashFaucetSecure: address is blacklisted");
        
        address requester = msg.sender;
        uint256 currentTime = block.timestamp;
        
        // Check cooldown
        require(
            currentTime >= lastRequestTime[requester] + requestCooldown,
            "FlashFaucetSecure: request too soon"
        );
        
        // Check and reset daily cap if needed
        if (currentTime >= dailyCapResetTime[requester]) {
            dailyClaimed[requester] = 0;
            dailyCapResetTime[requester] = currentTime + DAY_IN_SECONDS;
        }
        
        // Check daily cap
        require(
            dailyClaimed[requester] + amount <= dailyCapPerUser,
            "FlashFaucetSecure: exceeds daily cap"
        );
        
        // Update tracking
        lastRequestTime[requester] = currentTime;
        dailyClaimed[requester] += amount;
        totalRequests++;
        userRequestCount[requester]++;
        
        emit FlashRequested(requester, amount);
        
        // Mint tokens to requester (token contract handles max supply check)
        token.mint(requester, amount);
        
        totalTokensDistributed += amount;
        emit FlashGranted(requester, amount);
    }
    
    /**
     * @dev Get information about a user's current status
     * @param user Address to check
     * @return timeUntilNextRequest Seconds until next request is allowed
     * @return claimedToday Amount claimed today
     * @return remainingCap Remaining amount user can claim today
     * @return requestCount Total requests made by this user
     */
    function getUserInfo(address user) external view returns (
        uint256 timeUntilNextRequest,
        uint256 claimedToday,
        uint256 remainingCap,
        uint256 requestCount
    ) {
        uint256 currentTime = block.timestamp;
        
        uint256 lastRequest = lastRequestTime[user];
        if (currentTime >= lastRequest + requestCooldown) {
            timeUntilNextRequest = 0;
        } else {
            timeUntilNextRequest = (lastRequest + requestCooldown) - currentTime;
        }
        
        if (currentTime >= dailyCapResetTime[user]) {
            claimedToday = 0;
        } else {
            claimedToday = dailyClaimed[user];
        }
        
        remainingCap = dailyCapPerUser > claimedToday ? dailyCapPerUser - claimedToday : 0;
        requestCount = userRequestCount[user];
    }
    
    /**
     * @dev Update configuration (only owner)
     * @param newCooldown New cooldown period in seconds
     * @param newMaxAmount New maximum request amount
     * @param newDailyCap New daily cap per address
     */
    function updateConfiguration(
        uint256 newCooldown,
        uint256 newMaxAmount,
        uint256 newDailyCap
    ) external onlyOwner {
        require(newCooldown > 0, "FlashFaucetSecure: cooldown must be greater than zero");
        require(newMaxAmount > 0, "FlashFaucetSecure: max amount must be greater than zero");
        require(newDailyCap > 0, "FlashFaucetSecure: daily cap must be greater than zero");
        
        requestCooldown = newCooldown;
        maxRequestAmount = newMaxAmount;
        dailyCapPerUser = newDailyCap;
        
        emit ConfigurationUpdated(newCooldown, newMaxAmount, newDailyCap);
    }
    
    /**
     * @dev Blacklist/unblacklist an address
     * @param user Address to blacklist
     * @param blacklisted Whether to blacklist or not
     */
    function setBlacklist(address user, bool blacklisted) external onlyOwner {
        require(user != address(0), "FlashFaucetSecure: zero address");
        isBlacklisted[user] = blacklisted;
        emit BlacklistUpdated(user, blacklisted);
    }
    
    /**
     * @dev Pause all faucet operations (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Resume normal operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice This contract does not accept ETH
     * @dev Reject any ETH sent to the contract
     */
    receive() external payable {
        revert("FlashFaucetSecure: contract does not accept ETH");
    }
    
    /**
     * @notice This contract does not accept ETH
     * @dev Reject any ETH sent to the contract
     */
    fallback() external payable {
        revert("FlashFaucetSecure: contract does not accept ETH");
    }
}

