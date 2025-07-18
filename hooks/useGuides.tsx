import { useState, useEffect } from 'react';

type GuideSection = 'farm' | 'market' | 'animals' | 'crafting' | 'defend' | 'social' | 'quests' | 'profile' | 'swap' | 'platformer';

export function useGuides() {
  const [viewedGuides, setViewedGuides] = useState<Record<GuideSection, boolean>>({
    farm: false,
    market: false,
    animals: false,
    crafting: false,
    defend: false,
    social: false,
    quests: false,
    profile: false,
    swap: false,
    platformer: false
  });
  
  const [isMonPro, setIsMonPro] = useState(false);
  
  useEffect(() => {
    // Load viewed guides and pro status from localStorage
    if (typeof window !== "undefined") {
      const savedGuides = localStorage.getItem('viewed-guides');
      const savedProStatus = localStorage.getItem('mon-pro');
      
      if (savedGuides) {
        try {
          setViewedGuides(JSON.parse(savedGuides));
        } catch (error) {
          console.error('Error parsing viewed guides:', error);
        }
      }
      
      if (savedProStatus === 'true') {
        setIsMonPro(true);
      }
    }
  }, []);
  
  const markGuideAsViewed = (section: GuideSection) => {
    const updatedGuides = { ...viewedGuides, [section]: true };
    setViewedGuides(updatedGuides);
    
    if (typeof window !== "undefined") {
      localStorage.setItem('viewed-guides', JSON.stringify(updatedGuides));
    }
  };
  
  const shouldShowGuide = (section: GuideSection): boolean => {
    return !viewedGuides[section];
  };
  
  const setMonProStatus = (isPro: boolean) => {
    setIsMonPro(isPro);
    if (typeof window !== "undefined") {
      localStorage.setItem('mon-pro', isPro ? 'true' : 'false');
    }
  };
  
  // For development purposes - reset all guides
  const resetAllGuides = () => {
    const resetGuides = {
      farm: false,
      market: false,
      animals: false,
      crafting: false,
      defend: false,
      social: false,
      quests: false,
      profile: false,
      swap: false,
      platformer: false
    };
    
    setViewedGuides(resetGuides);
    
    if (typeof window !== "undefined") {
      localStorage.setItem('viewed-guides', JSON.stringify(resetGuides));
    }
  };
  
  return {
    shouldShowGuide,
    markGuideAsViewed,
    isMonPro,
    setMonProStatus,
    resetAllGuides
  };
} 