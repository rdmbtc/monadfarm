'use client';

import { useCallback, useEffect, useState } from 'react';

export function useUnifiedNickname() {
  // Local state for nickname when ReactTogether is not available
  const [localNickname, setLocalNickname] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  // Try to use ReactTogether nickname system if available
  let reactTogetherNickname: string = ''
  let setReactTogetherNickname: ((nickname: string) => void) | null = null
  let hasReactTogether = false

  try {
    const { useNicknames } = require('react-together')
    const [rtNickname, setRtNickname] = useNicknames()
    reactTogetherNickname = rtNickname
    setReactTogetherNickname = setRtNickname
    hasReactTogether = true
  } catch (error) {
    console.log('useUnifiedNickname: ReactTogether not available, using local storage')
    hasReactTogether = false
  }

  // Use ReactTogether nickname if available, otherwise use local
  const nickname = hasReactTogether ? reactTogetherNickname : localNickname

  console.log('useUnifiedNickname: Current nickname:', nickname, 'hasReactTogether:', hasReactTogether);

  // Load nickname from localStorage on mount if ReactTogether is not available
  useEffect(() => {
    if (!hasReactTogether && typeof window !== "undefined") {
      const stored = localStorage.getItem('player-nickname')
      if (stored && stored.trim() !== '') {
        console.log('useUnifiedNickname: Loading nickname from localStorage:', stored)
        setLocalNickname(stored)
      } else {
        // Generate a fallback nickname
        const adjectives = ["Happy", "Clever", "Bright", "Swift", "Kind", "Brave", "Calm", "Wise", "Green", "Golden"]
        const farmTerms = ["Farmer", "Harvester", "Grower", "Planter", "Gardener", "Rancher"]
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
        const term = farmTerms[Math.floor(Math.random() * farmTerms.length)]
        const fallbackName = `${adj} ${term}`
        console.log('useUnifiedNickname: Using fallback nickname:', fallbackName)
        setLocalNickname(fallbackName)
        localStorage.setItem('player-nickname', fallbackName)
      }
      setIsLoading(false)
    } else if (hasReactTogether) {
      setIsLoading(false)
    }
  }, [hasReactTogether])

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
      if (hasReactTogether && setReactTogetherNickname) {
        // Update React Together nickname
        setReactTogetherNickname(trimmedNickname);
      } else {
        // Update local nickname
        setLocalNickname(trimmedNickname);
      }

      // Also sync to localStorage immediately
      if (typeof window !== "undefined") {
        localStorage.setItem('player-nickname', trimmedNickname);
        console.log('useUnifiedNickname: Nickname saved to localStorage:', trimmedNickname);
      }

      console.log('useUnifiedNickname: Successfully updated nickname to:', trimmedNickname);
      return true;
    } catch (error) {
      console.error('useUnifiedNickname: Failed to update nickname:', error);
      return false;
    }
  }, [hasReactTogether, setReactTogetherNickname]);

  return {
    nickname: nickname || '',
    updateNickname,
    isLoading
  };
}
