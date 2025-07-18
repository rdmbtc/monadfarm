// Wallet adapters for Privy

// Export Privy implementations
export { usePrivy, useWallets } from '@privy-io/react-auth';

// Type definitions - keeping these for reference and type safety
export interface WalletProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on?: (event: string, callback: (...args: any[]) => void) => void;
  removeListener?: (event: string, callback: (...args: any[]) => void) => void;
}

export interface WalletClient {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnected: () => boolean;
  getAccounts: () => Promise<string[]>;
  provider: WalletProvider | null;
} 