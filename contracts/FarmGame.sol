// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FarmGame is Ownable, ReentrancyGuard {
    
    // Player data structure
    struct PlayerData {
        uint256 level;
        uint256 xp;
        uint256 farmCoins;
        uint256 farmSize;
        uint256 cropsHarvested;
        uint256 seedsPlanted;
        uint256 totalCoinsEarned;
        bool exists;
        uint256 lastSaveTime;
    }
    
    // Plot data structure
    struct Plot {
        uint8 status; // 0: empty, 1: growing, 2: ready
        string crop;
        uint256 plantedAt;
        uint256 readyAt;
    }
    
    // Crop inventory structure
    struct CropInventory {
        mapping(string => uint256) crops;
        string[] cropTypes;
    }
    
    // Animal data structure
    struct Animal {
        string animalType;
        uint256 level;
        uint256 happiness;
        uint256 lastFed;
        uint256 lastProduced;
        bool exists;
    }
    
    // Mappings
    mapping(address => PlayerData) public players;
    mapping(address => mapping(uint256 => Plot)) public playerPlots;
    mapping(address => mapping(string => uint256)) public playerCropInventory;
    mapping(address => string[]) public playerCropTypes;
    mapping(address => mapping(uint256 => Animal)) public playerAnimals;
    mapping(address => uint256) public playerAnimalCount;
    
    // Events
    event PlayerRegistered(address indexed player, uint256 timestamp);
    event PlayerDataSaved(address indexed player, uint256 level, uint256 xp, uint256 farmCoins);
    event PlotUpdated(address indexed player, uint256 plotIndex, uint8 status, string crop);
    event CropInventoryUpdated(address indexed player, string cropType, uint256 amount);
    event AnimalAdded(address indexed player, uint256 animalIndex, string animalType);
    event AnimalUpdated(address indexed player, uint256 animalIndex, uint256 level, uint256 happiness);
    
    constructor() Ownable(msg.sender) {}
    
    // Register a new player
    function registerPlayer() external {
        require(!players[msg.sender].exists, "Player already registered");
        
        players[msg.sender] = PlayerData({
            level: 1,
            xp: 0,
            farmCoins: 500, // Starting coins
            farmSize: 3,
            cropsHarvested: 0,
            seedsPlanted: 0,
            totalCoinsEarned: 0,
            exists: true,
            lastSaveTime: block.timestamp
        });
        
        emit PlayerRegistered(msg.sender, block.timestamp);
    }
    
    // Save player data
    function savePlayerData(
        uint256 _level,
        uint256 _xp,
        uint256 _farmCoins,
        uint256 _farmSize,
        uint256 _cropsHarvested,
        uint256 _seedsPlanted,
        uint256 _totalCoinsEarned
    ) external {
        require(players[msg.sender].exists, "Player not registered");
        
        PlayerData storage player = players[msg.sender];
        player.level = _level;
        player.xp = _xp;
        player.farmCoins = _farmCoins;
        player.farmSize = _farmSize;
        player.cropsHarvested = _cropsHarvested;
        player.seedsPlanted = _seedsPlanted;
        player.totalCoinsEarned = _totalCoinsEarned;
        player.lastSaveTime = block.timestamp;
        
        emit PlayerDataSaved(msg.sender, _level, _xp, _farmCoins);
    }
    
    // Save plot data
    function savePlot(
        uint256 _plotIndex,
        uint8 _status,
        string memory _crop,
        uint256 _plantedAt,
        uint256 _readyAt
    ) external {
        require(players[msg.sender].exists, "Player not registered");
        require(_plotIndex < players[msg.sender].farmSize, "Invalid plot index");
        
        playerPlots[msg.sender][_plotIndex] = Plot({
            status: _status,
            crop: _crop,
            plantedAt: _plantedAt,
            readyAt: _readyAt
        });
        
        emit PlotUpdated(msg.sender, _plotIndex, _status, _crop);
    }
    
    // Save multiple plots at once
    function saveMultiplePlots(
        uint256[] memory _plotIndices,
        uint8[] memory _statuses,
        string[] memory _crops,
        uint256[] memory _plantedAts,
        uint256[] memory _readyAts
    ) external {
        require(players[msg.sender].exists, "Player not registered");
        require(_plotIndices.length == _statuses.length, "Array length mismatch");
        require(_plotIndices.length == _crops.length, "Array length mismatch");
        require(_plotIndices.length == _plantedAts.length, "Array length mismatch");
        require(_plotIndices.length == _readyAts.length, "Array length mismatch");
        
        for (uint256 i = 0; i < _plotIndices.length; i++) {
            require(_plotIndices[i] < players[msg.sender].farmSize, "Invalid plot index");
            
            playerPlots[msg.sender][_plotIndices[i]] = Plot({
                status: _statuses[i],
                crop: _crops[i],
                plantedAt: _plantedAts[i],
                readyAt: _readyAts[i]
            });
            
            emit PlotUpdated(msg.sender, _plotIndices[i], _statuses[i], _crops[i]);
        }
    }
    
    // Save crop inventory
    function saveCropInventory(
        string[] memory _cropTypes,
        uint256[] memory _amounts
    ) external {
        require(players[msg.sender].exists, "Player not registered");
        require(_cropTypes.length == _amounts.length, "Array length mismatch");
        
        // Clear existing crop types
        delete playerCropTypes[msg.sender];
        
        // Save new crop inventory
        for (uint256 i = 0; i < _cropTypes.length; i++) {
            playerCropInventory[msg.sender][_cropTypes[i]] = _amounts[i];
            playerCropTypes[msg.sender].push(_cropTypes[i]);
            
            emit CropInventoryUpdated(msg.sender, _cropTypes[i], _amounts[i]);
        }
    }
    
    // Save animal data
    function saveAnimal(
        uint256 _animalIndex,
        string memory _animalType,
        uint256 _level,
        uint256 _happiness,
        uint256 _lastFed,
        uint256 _lastProduced
    ) external {
        require(players[msg.sender].exists, "Player not registered");
        
        playerAnimals[msg.sender][_animalIndex] = Animal({
            animalType: _animalType,
            level: _level,
            happiness: _happiness,
            lastFed: _lastFed,
            lastProduced: _lastProduced,
            exists: true
        });
        
        // Update animal count if this is a new animal
        if (_animalIndex >= playerAnimalCount[msg.sender]) {
            playerAnimalCount[msg.sender] = _animalIndex + 1;
        }
        
        emit AnimalUpdated(msg.sender, _animalIndex, _level, _happiness);
    }
    
    // Get player data
    function getPlayerData(address _player) external view returns (PlayerData memory) {
        return players[_player];
    }
    
    // Get plot data
    function getPlot(address _player, uint256 _plotIndex) external view returns (Plot memory) {
        return playerPlots[_player][_plotIndex];
    }
    
    // Get multiple plots
    function getMultiplePlots(address _player, uint256 _farmSize) external view returns (Plot[] memory) {
        Plot[] memory plots = new Plot[](_farmSize);
        for (uint256 i = 0; i < _farmSize; i++) {
            plots[i] = playerPlots[_player][i];
        }
        return plots;
    }
    
    // Get crop inventory
    function getCropInventory(address _player) external view returns (string[] memory, uint256[] memory) {
        string[] memory cropTypes = playerCropTypes[_player];
        uint256[] memory amounts = new uint256[](cropTypes.length);
        
        for (uint256 i = 0; i < cropTypes.length; i++) {
            amounts[i] = playerCropInventory[_player][cropTypes[i]];
        }
        
        return (cropTypes, amounts);
    }
    
    // Get animal data
    function getAnimal(address _player, uint256 _animalIndex) external view returns (Animal memory) {
        return playerAnimals[_player][_animalIndex];
    }
    
    // Get all animals for a player
    function getAllAnimals(address _player) external view returns (Animal[] memory) {
        uint256 count = playerAnimalCount[_player];
        Animal[] memory animals = new Animal[](count);
        
        for (uint256 i = 0; i < count; i++) {
            animals[i] = playerAnimals[_player][i];
        }
        
        return animals;
    }
    
    // Check if player exists
    function playerExists(address _player) external view returns (bool) {
        return players[_player].exists;
    }
    
    // Emergency functions for owner
    function emergencyResetPlayer(address _player) external onlyOwner {
        delete players[_player];
        delete playerCropTypes[_player];
        playerAnimalCount[_player] = 0;
    }
}
