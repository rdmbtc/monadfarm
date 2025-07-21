"use client"

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useStateTogether, useConnectedUsers, useMyId, useFunctionTogether } from 'react-together';
import { useUnifiedNickname } from '../hooks/useUnifiedNickname';
import { useFarmInventory } from '../hooks/useFarmInventory';
import { GameContext } from '../context/game-context';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRightLeft, 
  Plus, 
  Check, 
  X, 
  Clock, 
  Users,
  Package,
  Coins
} from "lucide-react";
import toast from 'react-hot-toast';

export interface TradeOffer {
  id: string;
  creatorId: string;
  creatorNickname: string;
  timestamp: number;
  status: 'active' | 'accepted' | 'declined' | 'expired';
  offering: TradeItem[];
  requesting: TradeItem[];
  description?: string;
  acceptedBy?: string;
  acceptedByNickname?: string;
  expiresAt: number;
}

export interface TradeItem {
  type: 'crop' | 'animal_product' | 'crafted_item';
  itemType: string;
  itemName: string;
  itemIcon: string;
  quantity: number;
  value: number;
}

// Safe array helper
function safeArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [];
}

export function TradingSystem() {
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'my-trades'>('browse');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // React Together state
  const [tradeOffers, setTradeOffers] = useStateTogether<TradeOffer[]>('trade-offers', []);
  const myId = useMyId();
  const connectedUsers = useConnectedUsers();
  const { nickname: myNickname } = useUnifiedNickname();

  // Farm inventory data
  const farmInventory = useFarmInventory();

  // Game context for inventory management
  const {
    removeCropFromInventory,
    addCropToInventoryDirect,
    removeAnimalProductFromInventory,
    addAnimalProductToInventoryDirect,
    removeCraftedItemFromInventory,
    addCraftedItemToInventoryDirect,
    seeds,
    animalProducts,
    craftableItems
  } = useContext(GameContext);
  
  // Real-time trade broadcasting
  const broadcastTradeEvent = useFunctionTogether('broadcastTradeEvent', (event: any) => {
    console.log('TradingSystem: Broadcasting trade event:', event);
    
    if (event.type === 'newTrade') {
      setTradeOffers(prev => {
        const currentTrades = safeArray<TradeOffer>(prev);
        const exists = currentTrades.some(t => t.id === event.trade.id);
        if (exists) return prev;
        return [event.trade, ...currentTrades].slice(0, 100);
      });
    } else if (event.type === 'tradeAccepted' || event.type === 'tradeDeclined') {
      // Handle inventory transfer for the trade creator
      if (event.type === 'tradeAccepted' && event.inventoryTransfer && event.inventoryTransfer.traderId === myId) {
        const { traderGives, traderReceives } = event.inventoryTransfer;

        // Remove offered items from trader's inventory
        for (const item of traderGives) {
          if (item.type === 'crop') {
            removeCropFromInventory(item.itemType, item.quantity);
          } else if (item.type === 'animal_product') {
            removeAnimalProductFromInventory(item.itemType, item.quantity);
          } else if (item.type === 'crafted_item') {
            removeCraftedItemFromInventory(item.itemType, item.quantity);
          }
        }

        // Add requested items to trader's inventory
        for (const item of traderReceives) {
          if (item.type === 'crop') {
            addCropToInventoryDirect(item.itemType, item.quantity, item.value);
          } else if (item.type === 'animal_product') {
            addAnimalProductToInventoryDirect(item.itemType, item.quantity, item.value);
          } else if (item.type === 'crafted_item') {
            addCraftedItemToInventoryDirect(item.itemType, item.quantity, item.value);
          }
        }

        toast.success('Your trade was accepted! Items transferred. 🎉');
      }

      setTradeOffers(prev => {
        const currentTrades = safeArray<TradeOffer>(prev);
        return currentTrades.map(trade =>
          trade.id === event.tradeId
            ? { ...trade, status: event.type === 'tradeAccepted' ? 'accepted' : 'declined',
                acceptedBy: event.acceptedBy, acceptedByNickname: event.acceptedByNickname }
            : trade
        );
      });
    }
  });

  // Create trade form state
  const [newTrade, setNewTrade] = useState({
    offering: [] as TradeItem[],
    requesting: [] as TradeItem[],
    description: ''
  });

  // Get available items for trading (including items for requesting)
  const getAvailableItems = useCallback((includeZeroQuantity: boolean = false) => {
    const items: TradeItem[] = [];

    // Add crops (both owned and all possible crops for requesting)
    farmInventory.cropDetails.forEach(crop => {
      if (crop.count > 0 || includeZeroQuantity) {
        items.push({
          type: 'crop',
          itemType: crop.type,
          itemName: crop.name,
          itemIcon: crop.icon,
          quantity: crop.count,
          value: crop.count > 0 ? crop.value / crop.count : 10 // Default value for requesting
        });
      }
    });

    // Add animal products (both owned and all possible products for requesting)
    farmInventory.animalProductDetails.forEach(product => {
      if (product.count > 0 || includeZeroQuantity) {
        items.push({
          type: 'animal_product',
          itemType: product.type,
          itemName: product.name,
          itemIcon: product.icon,
          quantity: product.count,
          value: product.count > 0 ? product.value / product.count : 15 // Default value for requesting
        });
      }
    });

    // Add crafted items (both owned and all possible items for requesting)
    farmInventory.craftedItemDetails.forEach(item => {
      if (item.count > 0 || includeZeroQuantity) {
        items.push({
          type: 'crafted_item',
          itemType: item.type,
          itemName: item.name,
          itemIcon: item.icon,
          quantity: item.count,
          value: item.count > 0 ? item.value / item.count : 20 // Default value for requesting
        });
      }
    });

    // If including zero quantity (for requesting), add all possible items from game context
    if (includeZeroQuantity) {
      // Add all seed types as potential crops to request
      seeds.forEach(seed => {
        const existingCrop = items.find(item => item.type === 'crop' && item.itemType === seed.type);
        if (!existingCrop) {
          items.push({
            type: 'crop',
            itemType: seed.type,
            itemName: seed.name,
            itemIcon: seed.icon,
            quantity: 0,
            value: Math.floor(seed.reward * 1.2)
          });
        }
      });

      // Add all animal product types
      animalProducts.forEach(product => {
        const existingProduct = items.find(item => item.type === 'animal_product' && item.itemType === product.type);
        if (!existingProduct) {
          items.push({
            type: 'animal_product',
            itemType: product.type,
            itemName: product.name,
            itemIcon: product.icon,
            quantity: 0,
            value: product.marketValue
          });
        }
      });

      // Add all craftable item types
      craftableItems.forEach(item => {
        const existingItem = items.find(existing => existing.type === 'crafted_item' && existing.itemType === item.type);
        if (!existingItem) {
          items.push({
            type: 'crafted_item',
            itemType: item.type,
            itemName: item.name,
            itemIcon: item.icon,
            quantity: 0,
            value: item.marketValue
          });
        }
      });
    }

    return items.sort((a, b) => {
      // Sort by type first, then by name
      if (a.type !== b.type) {
        const typeOrder = { 'crop': 0, 'animal_product': 1, 'crafted_item': 2 };
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return a.itemName.localeCompare(b.itemName);
    });
  }, [farmInventory, seeds, animalProducts, craftableItems]);

  // Filter active trades
  const activeTrades = safeArray<TradeOffer>(tradeOffers).filter(trade => 
    trade.status === 'active' && trade.expiresAt > Date.now()
  );
  
  const myTrades = safeArray<TradeOffer>(tradeOffers).filter(trade => 
    trade.creatorId === myId
  );

  // Create new trade offer
  const handleCreateTrade = useCallback(() => {
    if (newTrade.offering.length === 0 || newTrade.requesting.length === 0) {
      toast.error('Please add items to both offering and requesting sections');
      return;
    }

    const tradeOffer: TradeOffer = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      creatorId: myId || 'offline-user',
      creatorNickname: myNickname || 'Anonymous Farmer',
      timestamp: Date.now(),
      status: 'active',
      offering: newTrade.offering,
      requesting: newTrade.requesting,
      description: newTrade.description.trim(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    try {
      broadcastTradeEvent({
        type: 'newTrade',
        trade: tradeOffer,
        userId: myId,
        nickname: myNickname
      });

      setNewTrade({ offering: [], requesting: [], description: '' });
      setShowCreateForm(false);
      setActiveTab('my-trades');
      toast.success('Trade offer created successfully! 🤝');
    } catch (error) {
      console.error('Failed to create trade:', error);
      toast.error('Failed to create trade offer');
    }
  }, [newTrade, myId, myNickname, broadcastTradeEvent]);

  // Accept trade offer
  const handleAcceptTrade = useCallback((tradeId: string) => {
    const trade = safeArray<TradeOffer>(tradeOffers).find(t => t.id === tradeId);
    if (!trade) {
      toast.error('Trade offer not found');
      return;
    }

    // Check if accepter has the requested items
    let canAcceptTrade = true;
    const missingItems: string[] = [];

    for (const item of trade.requesting) {
      let hasEnough = false;

      if (item.type === 'crop') {
        const cropData = farmInventory.cropDetails.find(c => c.type === item.itemType);
        hasEnough = cropData && cropData.count >= item.quantity;
      } else if (item.type === 'animal_product') {
        const productData = farmInventory.animalProductDetails.find(p => p.type === item.itemType);
        hasEnough = productData && productData.count >= item.quantity;
      } else if (item.type === 'crafted_item') {
        const itemData = farmInventory.craftedItemDetails.find(i => i.type === item.itemType);
        hasEnough = itemData && itemData.count >= item.quantity;
      }

      if (!hasEnough) {
        canAcceptTrade = false;
        missingItems.push(`${item.quantity}x ${item.itemName}`);
      }
    }

    if (!canAcceptTrade) {
      toast.error(`You don't have enough items: ${missingItems.join(', ')}`);
      return;
    }

    try {
      // Perform inventory transfers
      // Remove requested items from accepter's inventory
      for (const item of trade.requesting) {
        let success = false;

        if (item.type === 'crop') {
          success = removeCropFromInventory(item.itemType, item.quantity);
        } else if (item.type === 'animal_product') {
          success = removeAnimalProductFromInventory(item.itemType, item.quantity);
        } else if (item.type === 'crafted_item') {
          success = removeCraftedItemFromInventory(item.itemType, item.quantity);
        }

        if (!success) {
          toast.error(`Failed to remove ${item.itemName} from inventory`);
          return;
        }
      }

      // Add offered items to accepter's inventory
      for (const item of trade.offering) {
        if (item.type === 'crop') {
          addCropToInventoryDirect(item.itemType, item.quantity, item.value);
        } else if (item.type === 'animal_product') {
          addAnimalProductToInventoryDirect(item.itemType, item.quantity, item.value);
        } else if (item.type === 'crafted_item') {
          addCraftedItemToInventoryDirect(item.itemType, item.quantity, item.value);
        }
      }

      // Broadcast trade acceptance with inventory transfer data
      broadcastTradeEvent({
        type: 'tradeAccepted',
        tradeId,
        acceptedBy: myId,
        acceptedByNickname: myNickname,
        inventoryTransfer: {
          traderId: trade.creatorId,
          accepterId: myId,
          traderGives: trade.offering,
          traderReceives: trade.requesting
        }
      });

      toast.success('Trade completed successfully! 🎉');
    } catch (error) {
      console.error('Failed to accept trade:', error);
      toast.error('Failed to complete trade');
    }
  }, [myId, myNickname, broadcastTradeEvent, tradeOffers, farmInventory,
      removeCropFromInventory, addCropToInventoryDirect,
      removeAnimalProductFromInventory, addAnimalProductToInventoryDirect,
      removeCraftedItemFromInventory, addCraftedItemToInventoryDirect]);

  // Decline trade offer
  const handleDeclineTrade = useCallback((tradeId: string) => {
    try {
      broadcastTradeEvent({
        type: 'tradeDeclined',
        tradeId,
        acceptedBy: myId,
        acceptedByNickname: myNickname
      });
      toast.success('Trade offer declined');
    } catch (error) {
      console.error('Failed to decline trade:', error);
      toast.error('Failed to decline trade offer');
    }
  }, [myId, myNickname, broadcastTradeEvent]);

  return (
    <div className="noot-card">
      {/* Header */}
      <div className="border-b border-[#333] p-4">
        <h2 className="noot-header flex items-center text-white noot-title">
          <ArrowRightLeft className="h-5 w-5 mr-2 text-green-400" />
          Trading Hub
        </h2>
        <p className="text-white/60 text-sm noot-text">
          {connectedUsers.length} farmers online • Trade items with other players
        </p>
      </div>

      <div className="p-4">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'browse', label: 'Browse Trades', count: activeTrades.length },
            { id: 'my-trades', label: 'My Trades', count: myTrades.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 border border-[#333] rounded-none noot-text transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-black'
                  : 'bg-[#111] text-white hover:bg-[#222]'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 text-xs border border-[#333] ${
                  activeTab === tab.id ? 'bg-black text-white' : 'bg-[#333] text-white'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => setShowCreateForm(true)}
            className="ml-auto px-4 py-2 bg-white text-black hover:bg-white/90 border-0 rounded-none noot-text flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Trade
          </button>
        </div>

        {/* Content based on active tab */}
        <div className="min-h-[400px]">
          {activeTab === 'browse' && (
            <BrowseTrades
              trades={activeTrades}
              myId={myId || ''}
              onAccept={handleAcceptTrade}
              onDecline={handleDeclineTrade}
            />
          )}
          {activeTab === 'my-trades' && (
            <MyTrades trades={myTrades} />
          )}
        </div>
      </div>

      {/* Create Trade Modal */}
      {showCreateForm && (
        <CreateTradeModal
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          availableItems={getAvailableItems()}
          allItems={getAvailableItems(true)}
          newTrade={newTrade}
          setNewTrade={setNewTrade}
          onCreateTrade={handleCreateTrade}
        />
      )}
    </div>
  );
}

// Browse Trades Component
function BrowseTrades({
  trades,
  myId,
  onAccept,
  onDecline
}: {
  trades: TradeOffer[];
  myId: string;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  if (trades.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        <div className="w-12 h-12 border border-[#333] flex items-center justify-center mx-auto mb-4 bg-[#111]">
          <Package className="h-6 w-6 text-white/40" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2 noot-text">No Active Trades</h3>
        <p className="text-white/60 noot-text">Be the first to create a trade offer!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {trades.map(trade => (
          <motion.div
            key={trade.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-[#333] bg-[#111] p-4 noot-text"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 border border-[#333] flex items-center justify-center mr-3">
                  <span className="text-white text-xs">👤</span>
                </div>
                <div>
                  <h3 className="text-white font-medium noot-text">{trade.creatorNickname}</h3>
                  <p className="text-xs text-white/60 noot-text">
                    {new Date(trade.timestamp).toLocaleDateString()} •
                    Expires {new Date(trade.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="px-2 py-1 bg-[#333] text-green-400 text-xs border border-[#333] noot-text flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Active
              </div>
            </div>

            {trade.description && (
              <p className="text-white/80 mb-4 text-sm noot-text italic">"{trade.description}"</p>
            )}

            <div className="grid md:grid-cols-3 gap-4 items-center">
              {/* Offering */}
              <div>
                <h4 className="text-sm font-medium text-green-400 mb-2 noot-text">Offering</h4>
                <div className="space-y-1">
                  {trade.offering.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 border border-[#333] bg-black">
                      <div className="w-6 h-6 border border-[#333] flex items-center justify-center text-sm">
                        {item.itemIcon}
                      </div>
                      <span className="text-white text-sm noot-text">{item.quantity}x {item.itemName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-8 h-8 border border-[#333] flex items-center justify-center bg-[#111]">
                  <ArrowRightLeft className="h-4 w-4 text-white/60" />
                </div>
              </div>

              {/* Requesting */}
              <div>
                <h4 className="text-sm font-medium text-blue-400 mb-2 noot-text">Requesting</h4>
                <div className="space-y-1">
                  {trade.requesting.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 border border-[#333] bg-black">
                      <div className="w-6 h-6 border border-[#333] flex items-center justify-center text-sm">
                        {item.itemIcon}
                      </div>
                      <span className="text-white text-sm noot-text">{item.quantity}x {item.itemName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            {trade.creatorId !== myId && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-[#333]">
                <button
                  onClick={() => onAccept(trade.id)}
                  className="bg-white text-black hover:bg-white/90 border-0 rounded-none flex-1 py-2 px-4 noot-text font-medium flex items-center justify-center"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept Trade
                </button>
                <button
                  onClick={() => onDecline(trade.id)}
                  className="bg-[#333] text-white hover:bg-[#444] border border-[#333] rounded-none flex-1 py-2 px-4 noot-text font-medium flex items-center justify-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  Decline
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// My Trades Component
function MyTrades({ trades }: { trades: TradeOffer[] }) {
  if (trades.length === 0) {
    return (
      <Card className="bg-[#171717] border-[#333]">
        <CardContent className="p-8 text-center">
          <ArrowRightLeft className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Trade Offers</h3>
          <p className="text-gray-400">Create your first trade offer to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {trades.map(trade => (
        <div key={trade.id} className="bg-[#171717] border border-[#333] rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium text-white">Your Trade Offer</h3>
              <p className="text-sm text-gray-400">
                Created {new Date(trade.timestamp).toLocaleDateString()}
              </p>
            </div>
            <Badge
              variant="secondary"
              className={
                trade.status === 'active' ? "bg-green-900/30 text-green-300" :
                trade.status === 'accepted' ? "bg-blue-900/30 text-blue-300" :
                "bg-red-900/30 text-red-300"
              }
            >
              {trade.status === 'active' && <Clock className="h-3 w-3 mr-1" />}
              {trade.status === 'accepted' && <Check className="h-3 w-3 mr-1" />}
              {trade.status === 'declined' && <X className="h-3 w-3 mr-1" />}
              {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
            </Badge>
          </div>

          {trade.description && (
            <p className="text-gray-300 mb-4 italic">"{trade.description}"</p>
          )}

          <div className="grid md:grid-cols-3 gap-4 items-center">
            {/* Offering */}
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-2">You're Offering</h4>
              <div className="space-y-2">
                {trade.offering.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-lg">{item.itemIcon}</span>
                    <span className="text-white">{item.quantity}x {item.itemName}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRightLeft className="h-6 w-6 text-gray-500" />
            </div>

            {/* Requesting */}
            <div>
              <h4 className="text-sm font-medium text-blue-400 mb-2">You're Requesting</h4>
              <div className="space-y-2">
                {trade.requesting.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-lg">{item.itemIcon}</span>
                    <span className="text-white">{item.quantity}x {item.itemName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {trade.status === 'accepted' && trade.acceptedByNickname && (
            <div className="mt-4 pt-4 border-t border-[#333]">
              <p className="text-green-400 text-sm">
                ✅ Accepted by {trade.acceptedByNickname}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Create Trade Modal Component
function CreateTradeModal({
  isOpen,
  onClose,
  availableItems,
  allItems,
  newTrade,
  setNewTrade,
  onCreateTrade
}: {
  isOpen: boolean;
  onClose: () => void;
  availableItems: TradeItem[];
  allItems: TradeItem[];
  newTrade: { offering: TradeItem[]; requesting: TradeItem[]; description: string };
  setNewTrade: React.Dispatch<React.SetStateAction<{ offering: TradeItem[]; requesting: TradeItem[]; description: string }>>;
  onCreateTrade: () => void;
}) {
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [addingTo, setAddingTo] = useState<'offering' | 'requesting'>('offering');

  if (!isOpen) return null;

  const addItemToTrade = () => {
    // Use appropriate item list based on what we're adding to
    const itemList = addingTo === 'offering' ? availableItems : allItems;
    const item = itemList.find(i => `${i.type}-${i.itemType}` === selectedItem);

    if (!item || quantity <= 0) return;

    // For offering, check if we have enough items
    if (addingTo === 'offering' && quantity > item.quantity) {
      return;
    }

    const tradeItem: TradeItem = {
      ...item,
      quantity
    };

    setNewTrade(prev => ({
      ...prev,
      [addingTo]: [...prev[addingTo], tradeItem]
    }));

    setSelectedItem('');
    setQuantity(1);
  };

  const removeItemFromTrade = (section: 'offering' | 'requesting', index: number) => {
    setNewTrade(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#171717] border border-[#333] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Create Trade Offer</h2>
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Add Items Section */}
          <Card className="bg-[#111] border-[#333] mb-6">
            <CardHeader>
              <CardTitle className="text-white">Add Items to Trade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger className="bg-[#171717] border-[#333] text-white">
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#171717] border-[#333]">
                    {(addingTo === 'offering' ? availableItems : allItems).map(item => (
                      <SelectItem
                        key={`${item.type}-${item.itemType}`}
                        value={`${item.type}-${item.itemType}`}
                        className="text-white hover:bg-[#333]"
                      >
                        {item.itemIcon} {item.itemName}
                        {addingTo === 'offering' ? ` (Available: ${item.quantity})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  min="1"
                  max={selectedItem && addingTo === 'offering' ?
                    (availableItems.find(i => `${i.type}-${i.itemType}` === selectedItem)?.quantity || 1) :
                    999}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="bg-[#171717] border-[#333] text-white"
                  placeholder="Quantity"
                />

                <Select value={addingTo} onValueChange={(value: 'offering' | 'requesting') => setAddingTo(value)}>
                  <SelectTrigger className="bg-[#171717] border-[#333] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#171717] border-[#333]">
                    <SelectItem value="offering" className="text-white hover:bg-[#333]">Add to Offering</SelectItem>
                    <SelectItem value="requesting" className="text-white hover:bg-[#333]">Add to Requesting</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={addItemToTrade}
                  disabled={!selectedItem}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trade Preview */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Offering */}
            <Card className="bg-[#111] border-[#333]">
              <CardHeader>
                <CardTitle className="text-green-400">You're Offering</CardTitle>
              </CardHeader>
              <CardContent>
                {newTrade.offering.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No items added yet</p>
                ) : (
                  <div className="space-y-2">
                    {newTrade.offering.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-[#171717] border border-[#333] rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{item.itemIcon}</span>
                          <span className="text-white">{item.quantity}x {item.itemName}</span>
                        </div>
                        <Button
                          onClick={() => removeItemFromTrade('offering', idx)}
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-400 hover:bg-red-600/10"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Requesting */}
            <Card className="bg-[#111] border-[#333]">
              <CardHeader>
                <CardTitle className="text-blue-400">You're Requesting</CardTitle>
              </CardHeader>
              <CardContent>
                {newTrade.requesting.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No items added yet</p>
                ) : (
                  <div className="space-y-2">
                    {newTrade.requesting.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-[#171717] border border-[#333] rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{item.itemIcon}</span>
                          <span className="text-white">{item.quantity}x {item.itemName}</span>
                        </div>
                        <Button
                          onClick={() => removeItemFromTrade('requesting', idx)}
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-400 hover:bg-red-600/10"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              Trade Description (Optional)
            </label>
            <Textarea
              value={newTrade.description}
              onChange={(e) => setNewTrade(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your trade offer..."
              className="bg-[#171717] border-[#333] text-white"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={onCreateTrade}
              disabled={newTrade.offering.length === 0 || newTrade.requesting.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
            >
              Create Trade Offer
            </Button>
            <Button onClick={onClose} variant="outline" className="border-gray-600 text-gray-300">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
