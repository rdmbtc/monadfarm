import { useContext, useMemo } from 'react';
import { GameContext } from '../context/game-context';

export interface FarmInventoryTotals {
  totalCrops: number;
  totalAnimals: number;
  totalCraftedItems: number;
  totalAnimalProducts: number;
  totalInventoryValue: number;
  cropDetails: Array<{
    type: string;
    name: string;
    count: number;
    value: number;
    icon: string;
  }>;
  animalDetails: Array<{
    type: string;
    name: string;
    icon: string;
    happiness: number;
    fed: boolean;
    productType: string;
  }>;
  craftedItemDetails: Array<{
    type: string;
    name: string;
    count: number;
    value: number;
    icon: string;
  }>;
  animalProductDetails: Array<{
    type: string;
    name: string;
    count: number;
    value: number;
    icon: string;
  }>;
}

export function useFarmInventory(): FarmInventoryTotals {
  const {
    cropInventory,
    animals,
    craftedItemInventory,
    animalProductInventory,
    seeds,
    craftableItems,
    animalProducts
  } = useContext(GameContext);

  return useMemo(() => {
    // Calculate crop totals and details
    const cropDetails = Object.entries(cropInventory).map(([type, data]) => {
      const seed = seeds.find(s => s.type === type);
      return {
        type,
        name: seed?.name || type,
        count: data.count,
        value: data.marketValue * data.count,
        icon: seed?.icon || '🌱'
      };
    });
    const totalCrops = cropDetails.reduce((sum, crop) => sum + crop.count, 0);

    // Calculate animal details
    const animalDetails = animals.map(animal => ({
      type: animal.type,
      name: animal.name,
      icon: animal.icon,
      happiness: animal.happiness,
      fed: animal.fed,
      productType: animal.productType
    }));
    const totalAnimals = animals.length;

    // Calculate crafted item totals and details
    const craftedItemDetails = Object.entries(craftedItemInventory).map(([type, data]) => {
      const item = craftableItems.find(i => i.type === type);
      return {
        type,
        name: item?.name || type,
        count: data.count,
        value: data.marketValue * data.count,
        icon: item?.icon || '🔧'
      };
    });
    const totalCraftedItems = craftedItemDetails.reduce((sum, item) => sum + item.count, 0);

    // Calculate animal product totals and details
    const animalProductDetails = Object.entries(animalProductInventory).map(([type, data]) => {
      const product = animalProducts.find(p => p.type === type);
      return {
        type,
        name: product?.name || type,
        count: data.count,
        value: data.marketValue * data.count,
        icon: product?.icon || '🥛'
      };
    });
    const totalAnimalProducts = animalProductDetails.reduce((sum, product) => sum + product.count, 0);

    // Calculate total inventory value
    const totalInventoryValue = 
      cropDetails.reduce((sum, crop) => sum + crop.value, 0) +
      craftedItemDetails.reduce((sum, item) => sum + item.value, 0) +
      animalProductDetails.reduce((sum, product) => sum + product.value, 0);

    return {
      totalCrops,
      totalAnimals,
      totalCraftedItems,
      totalAnimalProducts,
      totalInventoryValue,
      cropDetails,
      animalDetails,
      craftedItemDetails,
      animalProductDetails
    };
  }, [
    cropInventory,
    animals,
    craftedItemInventory,
    animalProductInventory,
    seeds,
    craftableItems,
    animalProducts
  ]);
}
