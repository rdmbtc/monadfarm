import React from 'react';
import { TokenSwap } from './components/token-swap';

// Simple test to verify the component loads without ReferenceError
export default function TestTokenSwap() {
  try {
    return (
      <div>
        <h1>Testing Token Swap Component</h1>
        <TokenSwap />
      </div>
    );
  } catch (error) {
    console.error('Error loading TokenSwap component:', error);
    return (
      <div>
        <h1>Error loading component</h1>
        <p>{error.message}</p>
      </div>
    );
  }
}
