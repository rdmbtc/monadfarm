import { ethers } from 'ethers';

// Farm Game Contract ABI (simplified for key functions)
const FARM_GAME_ABI = [
  "function registerPlayer() external",
  "function savePlayerData(uint256 _level, uint256 _xp, uint256 _farmCoins, uint256 _farmSize, uint256 _cropsHarvested, uint256 _seedsPlanted, uint256 _totalCoinsEarned) external",
  "function savePlot(uint256 _plotIndex, uint8 _status, string memory _crop, uint256 _plantedAt, uint256 _readyAt) external",
  "function saveMultiplePlots(uint256[] memory _plotIndices, uint8[] memory _statuses, string[] memory _crops, uint256[] memory _plantedAts, uint256[] memory _readyAts) external",
  "function saveCropInventory(string[] memory _cropTypes, uint256[] memory _amounts) external",
  "function getPlayerData(address _player) external view returns (tuple(uint256 level, uint256 xp, uint256 farmCoins, uint256 farmSize, uint256 cropsHarvested, uint256 seedsPlanted, uint256 totalCoinsEarned, bool exists, uint256 lastSaveTime))",
  "function getMultiplePlots(address _player, uint256 _farmSize) external view returns (tuple(uint8 status, string crop, uint256 plantedAt, uint256 readyAt)[])",
  "function getCropInventory(address _player) external view returns (string[], uint256[])",
  "function playerExists(address _player) external view returns (bool)",
  "event PlayerRegistered(address indexed player, uint256 timestamp)",
  "event PlayerDataSaved(address indexed player, uint256 level, uint256 xp, uint256 farmCoins)"
];

// Contract address (will be set after deployment)
const FARM_GAME_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FARM_GAME_CONTRACT_ADDRESS || "";

export interface PlayerData {
  level: number;
  xp: number;
  farmCoins: number;
  farmSize: number;
  cropsHarvested: number;
  seedsPlanted: number;
  totalCoinsEarned: number;
  exists: boolean;
  lastSaveTime: number;
}

export interface PlotData {
  status: number; // 0: empty, 1: growing, 2: ready
  crop: string;
  plantedAt: number;
  readyAt: number;
}

export interface CropInventoryData {
  cropTypes: string[];
  amounts: number[];
}

class BlockchainService {
  private contract: ethers.Contract | null = null;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  async initialize() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    if (!FARM_GAME_CONTRACT_ADDRESS) {
      throw new Error('Farm Game contract address not configured');
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    this.contract = new ethers.Contract(FARM_GAME_CONTRACT_ADDRESS, FARM_GAME_ABI, this.signer);
  }

  private ensureInitialized() {
    if (!this.contract || !this.signer) {
      throw new Error('Blockchain service not initialized');
    }
  }

  async registerPlayer(): Promise<void> {
    this.ensureInitialized();
    
    try {
      const tx = await this.contract!.registerPlayer();
      await tx.wait();
      console.log('Player registered successfully');
    } catch (error) {
      console.error('Error registering player:', error);
      throw error;
    }
  }

  async playerExists(address: string): Promise<boolean> {
    this.ensureInitialized();
    
    try {
      return await this.contract!.playerExists(address);
    } catch (error) {
      console.error('Error checking if player exists:', error);
      return false;
    }
  }

  async getPlayerData(address: string): Promise<PlayerData | null> {
    this.ensureInitialized();
    
    try {
      const data = await this.contract!.getPlayerData(address);
      
      if (!data.exists) {
        return null;
      }

      return {
        level: Number(data.level),
        xp: Number(data.xp),
        farmCoins: Number(data.farmCoins),
        farmSize: Number(data.farmSize),
        cropsHarvested: Number(data.cropsHarvested),
        seedsPlanted: Number(data.seedsPlanted),
        totalCoinsEarned: Number(data.totalCoinsEarned),
        exists: data.exists,
        lastSaveTime: Number(data.lastSaveTime)
      };
    } catch (error) {
      console.error('Error getting player data:', error);
      return null;
    }
  }

  async savePlayerData(playerData: Omit<PlayerData, 'exists' | 'lastSaveTime'>): Promise<void> {
    this.ensureInitialized();
    
    try {
      const tx = await this.contract!.savePlayerData(
        playerData.level,
        playerData.xp,
        playerData.farmCoins,
        playerData.farmSize,
        playerData.cropsHarvested,
        playerData.seedsPlanted,
        playerData.totalCoinsEarned
      );
      await tx.wait();
      console.log('Player data saved successfully');
    } catch (error) {
      console.error('Error saving player data:', error);
      throw error;
    }
  }

  async getPlots(address: string, farmSize: number): Promise<PlotData[]> {
    this.ensureInitialized();
    
    try {
      const plots = await this.contract!.getMultiplePlots(address, farmSize);
      
      return plots.map((plot: any) => ({
        status: Number(plot.status),
        crop: plot.crop,
        plantedAt: Number(plot.plantedAt),
        readyAt: Number(plot.readyAt)
      }));
    } catch (error) {
      console.error('Error getting plots:', error);
      return [];
    }
  }

  async savePlots(plots: Array<{ index: number; data: PlotData }>): Promise<void> {
    this.ensureInitialized();
    
    try {
      const indices = plots.map(p => p.index);
      const statuses = plots.map(p => p.data.status);
      const crops = plots.map(p => p.data.crop);
      const plantedAts = plots.map(p => p.data.plantedAt);
      const readyAts = plots.map(p => p.data.readyAt);

      const tx = await this.contract!.saveMultiplePlots(
        indices,
        statuses,
        crops,
        plantedAts,
        readyAts
      );
      await tx.wait();
      console.log('Plots saved successfully');
    } catch (error) {
      console.error('Error saving plots:', error);
      throw error;
    }
  }

  async getCropInventory(address: string): Promise<CropInventoryData> {
    this.ensureInitialized();
    
    try {
      const [cropTypes, amounts] = await this.contract!.getCropInventory(address);
      
      return {
        cropTypes: cropTypes,
        amounts: amounts.map((amount: any) => Number(amount))
      };
    } catch (error) {
      console.error('Error getting crop inventory:', error);
      return { cropTypes: [], amounts: [] };
    }
  }

  async saveCropInventory(cropInventory: CropInventoryData): Promise<void> {
    this.ensureInitialized();
    
    try {
      const tx = await this.contract!.saveCropInventory(
        cropInventory.cropTypes,
        cropInventory.amounts
      );
      await tx.wait();
      console.log('Crop inventory saved successfully');
    } catch (error) {
      console.error('Error saving crop inventory:', error);
      throw error;
    }
  }

  async getCurrentAddress(): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer not available');
    }
    return await this.signer.getAddress();
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
