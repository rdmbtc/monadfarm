'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNicknames } from 'react-together';

export function useUnifiedNickname() {
  // React Together nickname system
  const [reactTogetherNickname, setReactTogetherNickname] = useNicknames();
  
  // Local nickname state
  const [localNickname, setLocalNickname] = useState<string>('');
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize nickname from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedNickname = localStorage.getItem('player-nickname');
      console.log('useUnifiedNickname: Loading from localStorage:', savedNickname);
      console.log('useUnifiedNickname: Current React Together nickname:', reactTogetherNickname);

      if (savedNickname && savedNickname.trim() !== '') {
        setLocalNickname(savedNickname);
        // Always sync localStorage to React Together if they're different
        if (savedNickname !== reactTogetherNickname) {
          console.log('useUnifiedNickname: Syncing localStorage to React Together:', savedNickname);
          setReactTogetherNickname(savedNickname);
        }
      } else if (reactTogetherNickname && reactTogetherNickname.trim() !== '') {
        // If no localStorage but React Together has a nickname, use that
        console.log('useUnifiedNickname: Using React Together nickname:', reactTogetherNickname);
        setLocalNickname(reactTogetherNickname);
        localStorage.setItem('player-nickname', reactTogetherNickname);
      }

      setIsLoading(false);
    }
  }, [reactTogetherNickname, setReactTogetherNickname]); // Run when React Together nickname changes
  
  // Sync React Together nickname changes to local state and localStorage
  useEffect(() => {
    if (!isLoading && reactTogetherNickname && reactTogetherNickname !== localNickname) {
      console.log('useUnifiedNickname: React Together nickname changed, syncing to local:', reactTogetherNickname);
      setLocalNickname(reactTogetherNickname);
      if (typeof window !== "undefined") {
        localStorage.setItem('player-nickname', reactTogetherNickname);
      }
    }
  }, [reactTogetherNickname, localNickname, isLoading]);
  
  // Function to update nickname (updates both systems)
  const updateNickname = useCallback((newNickname: string) => {
    console.log('useUnifiedNickname: Updating nickname to:', newNickname);
    
    if (!newNickname || !newNickname.trim()) {
      console.warn('useUnifiedNickname: Invalid nickname provided');
      return false;
    }
    
    const trimmedNickname = newNickname.trim();
    
    try {
      // Update local state
      setLocalNickname(trimmedNickname);
      
      // Update React Together
      setReactTogetherNickname(trimmedNickname);
      
      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem('player-nickname', trimmedNickname);
      }
      
      console.log('useUnifiedNickname: Successfully updated nickname to:', trimmedNickname);
      return true;
    } catch (error) {
      console.error('useUnifiedNickname: Failed to update nickname:', error);
      return false;
    }
  }, [setReactTogetherNickname]);
  
  // Get the current nickname (prefer local state as it's more reliable)
  const currentNickname = localNickname || reactTogetherNickname || '';
  
  return {
    nickname: currentNickname,
    updateNickname,
    isLoading,
    // Also expose the individual systems for debugging
    localNickname,
    reactTogetherNickname
  };
}
