# Console Errors Fix Guide

This guide addresses the common console errors you may encounter after deployment and provides solutions.

## ✅ Fixed Issues

### 1. Missing Asset Error (nooter.png) - RESOLVED
**Error**: `nooter.png:1 Failed to load resource: the server responded with a status of 404`

**Solution**: Created the missing `nooter.png` file in `/public/images/` directory.

### 2. Duplicate WalletConnect Initialization - RESOLVED
**Error**: "WalletConnect Core is already initialized"

**Solution**: Modified providers to only initialize ReactTogether on client-side, preventing duplicate initialization during SSR.

### 3. Coinbase Smart Wallet Chain Support - RESOLVED
**Error**: "The configured chains are not supported by Coinbase Smart Wallet: 10143"

**Solution**: Updated Privy configuration to handle unsupported chains gracefully and provide better error messages.

## 🔧 Configuration Required

### 4. WalletConnect API Authentication Errors
**Errors**: 
- `explorer-api.walletconnect.com` returning 401 (unauthorized)
- `api.web3modal.org` returning 403 (forbidden)

**Solution**: You need to configure your WalletConnect Project ID.

#### Steps to Fix:
1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project or use an existing one
3. Copy your Project ID
4. Add it to your `.env` file:
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id-here
   ```
5. Restart your development server

### 5. Privy Configuration
**Required**: Set up your Privy App ID for wallet authentication.

#### Steps to Fix:
1. Visit [Privy Dashboard](https://dashboard.privy.io/)
2. Create a new app or use an existing one
3. Copy your App ID
4. Add it to your `.env` file:
   ```env
   NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id-here
   ```

### 6. Multisynq Configuration
**Required**: Set up Multisynq for real-time features.

#### Steps to Fix:
1. Visit [Multisynq](https://multisynq.io/coder)
2. Sign up for a free account
3. Create a new application
4. Copy your API key
5. Add it to your `.env` file:
   ```env
   NEXT_PUBLIC_MULTISYNQ_API_KEY=your-multisynq-api-key-here
   ```

## 📋 Complete Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# Required for wallet authentication
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id-here

# Required for WalletConnect functionality
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id-here

# Required for real-time features
NEXT_PUBLIC_MULTISYNQ_API_KEY=your-multisynq-api-key-here

# Optional - for enhanced real-time features
NEXT_PUBLIC_REACT_TOGETHER_API_KEY=your-react-together-api-key-here

# Application configuration
NEXT_PUBLIC_APP_ID=com.monfarm.social
NEXT_PUBLIC_APP_NAME=MonFarm Social Hub
```

## 🛠️ Development Tools

### Configuration Checker
In development mode, you'll see a "Check Config" button in the bottom-right corner. Click it to verify your environment variables are properly configured.

### Console Warnings
The application will log helpful warnings in development mode if required environment variables are missing.

## 🔍 Troubleshooting

### MetaMask Connection Issues
- Ensure MetaMask is installed and unlocked
- Check that you're on the correct network (Monad Testnet)
- Clear browser cache if issues persist

### WalletConnect Issues
- Verify your Project ID is correct
- Check your internet connection
- Try refreshing the page

### Real-time Features Not Working
- Verify Multisynq API key is set
- Check browser console for specific error messages
- Ensure you're not blocking WebSocket connections

## 📞 Support

If you continue to experience issues:
1. Check the browser console for specific error messages
2. Verify all environment variables are set correctly
3. Restart your development server after making changes
4. Clear browser cache and cookies

## 🚀 After Configuration

Once all environment variables are properly configured:
1. Restart your development server
2. Clear browser cache
3. Test wallet connections
4. Verify real-time features are working
5. Check that no console errors remain

The application should now run without console errors and all features should work properly!
