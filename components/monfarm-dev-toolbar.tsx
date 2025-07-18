"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// MonFarm Development Toolbar Component
export function MonFarmDevToolbar() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only show in development mode
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  const quickLinks = [
    { name: 'Enhanced Social Hub', path: '/enhanced-social-hub', icon: '👥', color: 'bg-purple-600' },
    { name: 'Amazing Social Hub', path: '/amazing-social-hub', icon: '🚀', color: 'bg-pink-600' },
    { name: 'Multisynq Test', path: '/multisynq-test', icon: '🔧', color: 'bg-blue-600' },
    { name: 'Farm Cases', path: '/farm-cases', icon: '📦', color: 'bg-green-600' },
    { name: 'Slot Machine', path: '/slot-machine/app', icon: '🎰', color: 'bg-yellow-600' },
    { name: 'Sport Betting', path: '/sport-betting/app', icon: '⚽', color: 'bg-red-600' },
    { name: 'Social Hub', path: '/social-hub/app', icon: '🌐', color: 'bg-indigo-600' },
  ];

  const devTools = [
    {
      name: 'Clear Storage',
      action: () => {
        localStorage.clear();
        sessionStorage.clear();
        console.log('🧹 Storage cleared');
        window.location.reload();
      },
      icon: '🧹',
    },
    {
      name: 'Reload Page',
      action: () => window.location.reload(),
      icon: '🔄',
    },
    {
      name: 'Console Log',
      action: () => {
        console.log('🚀 MonFarm Dev Toolbar - Current State:', {
          url: window.location.href,
          localStorage: { ...localStorage },
          sessionStorage: { ...sessionStorage },
          userAgent: navigator.userAgent,
        });
      },
      icon: '📝',
    },
    {
      name: 'Network Info',
      action: () => {
        console.log('🌐 Network Information:', {
          online: navigator.onLine,
          connection: (navigator as any).connection,
          cookieEnabled: navigator.cookieEnabled,
        });
      },
      icon: '🌐',
    },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-mono">
      {/* Main Toolbar Button */}
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 backdrop-blur-sm border border-white/20"
          title="MonFarm Dev Toolbar"
        >
          <span className="text-xl">🛠️</span>
        </button>

        {/* Expanded Toolbar */}
        {isExpanded && (
          <div className="absolute bottom-16 right-0 bg-black/90 backdrop-blur-md border border-purple-500/30 rounded-xl p-4 min-w-[300px] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-500/30">
              <h3 className="text-purple-400 font-bold text-sm">🚀 MonFarm Dev Tools</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick Links */}
            <div className="mb-4">
              <h4 className="text-purple-300 text-xs font-semibold mb-2 uppercase tracking-wide">Quick Navigation</h4>
              <div className="grid grid-cols-2 gap-2">
                {quickLinks.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => router.push(link.path)}
                    className={`${link.color} hover:opacity-80 text-white text-xs p-2 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2`}
                    title={link.name}
                  >
                    <span>{link.icon}</span>
                    <span className="truncate">{link.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Development Tools */}
            <div className="mb-4">
              <h4 className="text-purple-300 text-xs font-semibold mb-2 uppercase tracking-wide">Dev Tools</h4>
              <div className="grid grid-cols-2 gap-2">
                {devTools.map((tool) => (
                  <button
                    key={tool.name}
                    onClick={tool.action}
                    className="bg-gray-700 hover:bg-gray-600 text-white text-xs p-2 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                    title={tool.name}
                  >
                    <span>{tool.icon}</span>
                    <span className="truncate">{tool.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Environment Info */}
            <div className="text-xs text-gray-400 pt-2 border-t border-purple-500/30">
              <div className="flex justify-between items-center">
                <span>🌟 Development Mode</span>
                <span className="text-green-400">●</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span>📍 {window.location.pathname}</span>
                <span className="text-purple-400">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            {/* MonFarm Branding */}
            <div className="text-center mt-3 pt-2 border-t border-purple-500/30">
              <span className="text-xs text-purple-400 font-semibold">Powered by MonFarm 🌟</span>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcut Hint */}
      {!isExpanded && (
        <div className="absolute bottom-16 right-0 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          Press to open dev tools
        </div>
      )}
    </div>
  );
}

// Keyboard shortcut handler
export function useDevToolbarShortcuts() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + D to toggle toolbar
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        const toolbar = document.querySelector('[data-monfarm-dev-toolbar]') as HTMLElement;
        if (toolbar) {
          toolbar.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
