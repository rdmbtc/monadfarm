'use client';

import { useCallback, useEffect } from 'react';
import { useNicknames } from 'react-together';

export function useUnifiedNickname() {
  // React Together nickname system (now properly configured with deriveNickname)
  const [nickname, setNickname] = useNicknames();

  console.log('useUnifiedNickname: Current nickname:', nickname);

  // Sync nickname changes to localStorage
  useEffect(() => {
    if (nickname && nickname.trim() !== '' && typeof window !== "undefined") {
      console.log('useUnifiedNickname: Syncing nickname to localStorage:', nickname);
      localStorage.setItem('player-nickname', nickname);
    }
  }, [nickname]);

  // Function to update nickname
  const updateNickname = useCallback((newNickname: string) => {
    console.log('useUnifiedNickname: Updating nickname to:', newNickname);

    if (!newNickname || !newNickname.trim()) {
      console.warn('useUnifiedNickname: Invalid nickname provided');
      return false;
    }

    const trimmedNickname = newNickname.trim();

    try {
      // Update React Together (localStorage sync happens automatically via useEffect)
      setNickname(trimmedNickname);

      console.log('useUnifiedNickname: Successfully updated nickname to:', trimmedNickname);
      return true;
    } catch (error) {
      console.error('useUnifiedNickname: Failed to update nickname:', error);
      return false;
    }
  }, [setNickname]);

  return {
    nickname,
    updateNickname,
    isLoading: false // No longer needed since deriveNickname handles initialization
  };
}
