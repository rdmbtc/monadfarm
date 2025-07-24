// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MonadFarmSwap
 * @dev A contract for swapping Monad testnet tokens for Farm Coins at 1:1 ratio
 */
contract MonadFarmSwap is Ownable, ReentrancyGuard {
    
    // Token information structure
    struct TokenInfo {
        bool isSupported;      // Whether the token is supported
        uint256 balance;       // Current token balance for tracking purposes
        string symbol;         // Token symbol for display
        string name;           // Token name for display
    }
    
    // Mapping of token addresses to their info
    mapping(address => TokenInfo) public supportedTokens;
    
    // List of supported token addresses for enumeration
    address[] public tokenList;
    
    // Farm Coins balance mapping (internal currency)
    mapping(address => uint256) public farmCoinsBalance;
    
    // Total Farm Coins in circulation
    uint256 public totalFarmCoins;
    
    // Exchange rate (1 token = X farm coins, scaled by 1e18)
    uint256 public constant EXCHANGE_RATE = 1e18; // 1:1 ratio
    
    // Events
    event TokenAdded(address indexed tokenAddress, string symbol, string name);
    event TokenRemoved(address indexed tokenAddress);
    event TokenSwapped(address indexed fromToken, address indexed user, uint256 tokenAmount, uint256 farmCoinsAmount);
    event TokenFunded(address indexed tokenAddress, address indexed funder, uint256 amount);
    event FarmCoinsWithdrawn(address indexed user, uint256 amount);
    event NativeTokenSwapped(address indexed user, uint256 amount, uint256 farmCoinsAmount);
    
    /**
     * @dev Constructor - initializes the contract
     */
    constructor() Ownable(msg.sender) {
        // Add Monad testnet tokens
        _addToken(0xb2f82D0f38dc453D596Ad40A37799446Cc89274A, "aprMON", "April Monad");
        _addToken(0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50, "YAKI", "Moyaki");
        _addToken(0xE0590015A873bF326bd645c3E1266d4db41C4E6B, "CHOG", "Chog");
        _addToken(0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714, "DAK", "Molandak");
        _addToken(0xaEef2f6B429Cb59C9B2D7bB2141ADa993E8571c3, "gMON", "gMON");
        _addToken(0x3a98250F98Dd388C211206983453837C8365BDc1, "shMON", "ShMonad");
    }
    
    /**
     * @dev Internal function to add a token
     */
    function _addToken(address tokenAddress, string memory symbol, string memory name) internal {
        require(tokenAddress != address(0), "Invalid token address");
        require(!supportedTokens[tokenAddress].isSupported, "Token already supported");
        
        supportedTokens[tokenAddress] = TokenInfo({
            isSupported: true,
            balance: 0,
            symbol: symbol,
            name: name
        });
        
        tokenList.push(tokenAddress);
        
        emit TokenAdded(tokenAddress, symbol, name);
    }
    
    /**
     * @dev Add a new token to be supported for swap
     */
    function addToken(address tokenAddress, string memory symbol, string memory name) external onlyOwner {
        _addToken(tokenAddress, symbol, name);
    }
    
    /**
     * @dev Add multiple tokens at once
     */
    function addMultipleTokens(
        address[] memory tokenAddresses, 
        string[] memory symbols, 
        string[] memory names
    ) public onlyOwner {
        require(tokenAddresses.length == symbols.length && symbols.length == names.length, "Array length mismatch");
        
        for (uint i = 0; i < tokenAddresses.length; i++) {
            if (tokenAddresses[i] != address(0) && !supportedTokens[tokenAddresses[i]].isSupported) {
                _addToken(tokenAddresses[i], symbols[i], names[i]);
            }
        }
    }
    
    /**
     * @dev Remove a token from being supported
     */
    function removeToken(address tokenAddress) external onlyOwner {
        require(supportedTokens[tokenAddress].isSupported, "Token not supported");
        
        // Find and remove token from the list
        for (uint256 i = 0; i < tokenList.length; i++) {
            if (tokenList[i] == tokenAddress) {
                tokenList[i] = tokenList[tokenList.length - 1];
                tokenList.pop();
                break;
            }
        }
        
        // Mark as not supported but keep the balance info
        supportedTokens[tokenAddress].isSupported = false;
        
        emit TokenRemoved(tokenAddress);
    }
    
    /**
     * @dev Swap tokens for Farm Coins
     */
    function swapTokenForFarmCoins(address tokenAddress, uint256 amount) external nonReentrant {
        require(supportedTokens[tokenAddress].isSupported, "Token not supported");
        require(amount > 0, "Amount must be positive");
        
        IERC20 token = IERC20(tokenAddress);
        
        // Transfer tokens from sender to contract
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        
        // Calculate farm coins to give (1:1 ratio)
        uint256 farmCoinsAmount = amount;
        
        // Update balances
        supportedTokens[tokenAddress].balance += amount;
        farmCoinsBalance[msg.sender] += farmCoinsAmount;
        totalFarmCoins += farmCoinsAmount;
        
        emit TokenSwapped(tokenAddress, msg.sender, amount, farmCoinsAmount);
    }
    
    /**
     * @dev Swap native MON for Farm Coins
     */
    function swapNativeForFarmCoins() external payable nonReentrant {
        require(msg.value > 0, "Amount must be positive");
        
        // Calculate farm coins to give (1:1 ratio)
        uint256 farmCoinsAmount = msg.value;
        
        // Update balances
        farmCoinsBalance[msg.sender] += farmCoinsAmount;
        totalFarmCoins += farmCoinsAmount;
        
        emit NativeTokenSwapped(msg.sender, msg.value, farmCoinsAmount);
    }
    
    /**
     * @dev Get user's farm coins balance
     */
    function getFarmCoinsBalance(address user) external view returns (uint256) {
        return farmCoinsBalance[user];
    }
    
    /**
     * @dev Get the list of all supported tokens
     */
    function getAllSupportedTokens() external view returns (address[] memory) {
        return tokenList;
    }
    
    /**
     * @dev Get token information
     */
    function getTokenInfo(address tokenAddress) external view returns (
        bool isSupported,
        uint256 balance,
        uint256 actualBalance,
        string memory symbol,
        string memory name
    ) {
        TokenInfo storage info = supportedTokens[tokenAddress];
        return (
            info.isSupported,
            info.balance,
            IERC20(tokenAddress).balanceOf(address(this)),
            info.symbol,
            info.name
        );
    }
    
    /**
     * @dev Fund the contract with tokens (for liquidity)
     */
    function fundToken(address tokenAddress, uint256 amount) external {
        require(supportedTokens[tokenAddress].isSupported, "Token not supported");
        require(amount > 0, "Amount must be positive");
        
        IERC20 token = IERC20(tokenAddress);
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Update the balance in our tracking
        supportedTokens[tokenAddress].balance += amount;
        
        emit TokenFunded(tokenAddress, msg.sender, amount);
    }
    
    /**
     * @dev Emergency withdraw tokens (owner only)
     */
    function emergencyWithdraw(address tokenAddress, uint256 amount, address recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        
        if (tokenAddress == address(0)) {
            // Withdraw native tokens
            require(address(this).balance >= amount, "Insufficient balance");
            payable(recipient).transfer(amount);
        } else {
            // Withdraw ERC20 tokens
            IERC20 token = IERC20(tokenAddress);
            uint256 contractBalance = token.balanceOf(address(this));
            require(contractBalance >= amount, "Insufficient balance");
            require(token.transfer(recipient, amount), "Transfer failed");
            
            // Update the balance in our tracking if it's a supported token
            if (supportedTokens[tokenAddress].isSupported && supportedTokens[tokenAddress].balance >= amount) {
                supportedTokens[tokenAddress].balance -= amount;
            }
        }
    }
    
    /**
     * @dev Allow contract to receive native tokens
     */
    receive() external payable {
        // Allow the contract to receive native MON tokens
    }
}
