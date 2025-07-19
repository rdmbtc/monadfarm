'use client';

import { useState, useEffect, ReactNode } from 'react';

interface NoSSRWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * NoSSRWrapper ensures content is only rendered on the client side
 * This prevents any window/document access during server-side rendering or build time
 */
export function NoSSRWrapper({ children, fallback }: NoSSRWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // During server-side rendering or build time, return fallback or null
  if (!isMounted) {
    return fallback || null;
  }
  
  // Once mounted on the client, render the children
  return <>{children}</>;
}

export default NoSSRWrapper;
