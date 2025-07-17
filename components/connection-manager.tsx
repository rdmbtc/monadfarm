"use client"

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Settings,
  Users,
  Clock,
  Zap
} from 'lucide-react';
import { useMultisynq } from '../hooks/useMultisynq';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface ConnectionManagerProps {
  onConnectionChange?: (connected: boolean) => void;
  showAdvancedOptions?: boolean;
  autoReconnect?: boolean;
}

export function ConnectionManager({ 
  onConnectionChange,
  showAdvancedOptions = false,
  autoReconnect = true
}: ConnectionManagerProps) {
  const {
    isConnected,
    isLoading,
    error,
    session,
    currentUser,
    users,
    onlineCount,
    connect,
    disconnect,
    getSessionUrl
  } = useMultisynq({ autoConnect: false });

  const [sessionName, setSessionName] = useState('');
  const [password, setPassword] = useState('');
  const [showManualConnect, setShowManualConnect] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastConnectionTime, setLastConnectionTime] = useState<number | null>(null);
  const [reconnectTimer, setReconnectTimer] = useState<NodeJS.Timeout | null>(null);

  // Handle connection state changes
  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange(isConnected);
    }
    
    if (isConnected) {
      setConnectionAttempts(0);
      setLastConnectionTime(Date.now());
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        setReconnectTimer(null);
      }
    }
  }, [isConnected, onConnectionChange]);

  // Auto-reconnect logic
  useEffect(() => {
    if (!isConnected && !isLoading && autoReconnect && connectionAttempts < 5 && lastConnectionTime) {
      const timeSinceLastConnection = Date.now() - lastConnectionTime;
      
      // Only auto-reconnect if we were previously connected and it's been less than 5 minutes
      if (timeSinceLastConnection < 5 * 60 * 1000) {
        const delay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000); // Exponential backoff, max 30s
        
        const timer = setTimeout(() => {
          handleQuickConnect();
        }, delay);
        
        setReconnectTimer(timer);
        
        return () => {
          if (timer) clearTimeout(timer);
        };
      }
    }
  }, [isConnected, isLoading, autoReconnect, connectionAttempts, lastConnectionTime]);

  // Handle quick connect (create new session)
  const handleQuickConnect = async () => {
    try {
      setConnectionAttempts(prev => prev + 1);
      await connect();
      toast.success('Connected to real-time social hub!');
    } catch (err) {
      toast.error('Failed to connect. Please try again.');
    }
  };

  // Handle manual connect (join existing session)
  const handleManualConnect = async () => {
    if (!sessionName.trim()) {
      toast.error('Please enter a session name');
      return;
    }
    
    try {
      setConnectionAttempts(prev => prev + 1);
      await connect(sessionName.trim(), password.trim() || undefined);
      toast.success(`Joined session: ${sessionName}`);
      setShowManualConnect(false);
    } catch (err) {
      toast.error('Failed to join session. Please check the session name and try again.');
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    disconnect();
    setConnectionAttempts(0);
    setLastConnectionTime(null);
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      setReconnectTimer(null);
    }
    toast.success('Disconnected from social hub');
  };

  // Get connection status info
  const getConnectionStatus = () => {
    if (isLoading) return { icon: RefreshCw, color: 'text-yellow-500', text: 'Connecting...', spin: true };
    if (isConnected) return { icon: CheckCircle, color: 'text-green-500', text: 'Connected', spin: false };
    if (error) return { icon: AlertCircle, color: 'text-red-500', text: 'Connection Error', spin: false };
    return { icon: WifiOff, color: 'text-gray-500', text: 'Disconnected', spin: false };
  };

  const status = getConnectionStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="bg-[#171717] border-[#333]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${status.color} ${status.spin ? 'animate-spin' : ''}`} />
            <span>Connection Status</span>
          </div>
          
          <Badge 
            variant="outline" 
            className={`${
              isConnected 
                ? 'bg-green-500/20 text-green-400 border-green-500/50' 
                : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
            }`}
          >
            {status.text}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Info */}
        {isConnected && session && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-[#222] rounded border border-[#333]"
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-white/60 mb-1">Session</div>
                <div className="text-white font-mono">{session.name}</div>
              </div>
              <div>
                <div className="text-white/60 mb-1">Your Nickname</div>
                <div className="text-white">{currentUser?.nickname || 'Loading...'}</div>
              </div>
              <div>
                <div className="text-white/60 mb-1">Online Users</div>
                <div className="flex items-center gap-1 text-white">
                  <Users className="h-3 w-3" />
                  {onlineCount}
                </div>
              </div>
              <div>
                <div className="text-white/60 mb-1">Connected Since</div>
                <div className="flex items-center gap-1 text-white">
                  <Clock className="h-3 w-3" />
                  {lastConnectionTime ? new Date(lastConnectionTime).toLocaleTimeString() : 'Unknown'}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert className="bg-red-500/10 border-red-500/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-400">
                  {error}
                  {connectionAttempts > 0 && (
                    <span className="block mt-1 text-xs">
                      Reconnection attempts: {connectionAttempts}/5
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection Actions */}
        <div className="space-y-3">
          {!isConnected && (
            <>
              <Button 
                onClick={handleQuickConnect}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Quick Connect
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowManualConnect(!showManualConnect)}
                className="w-full bg-transparent border-[#333] hover:bg-[#222] text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Join Existing Session
              </Button>
            </>
          )}

          {isConnected && (
            <Button
              variant="outline"
              onClick={handleDisconnect}
              className="w-full bg-transparent border-[#333] hover:bg-[#222] text-white"
            >
              <WifiOff className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          )}
        </div>

        {/* Manual Connection Form */}
        <AnimatePresence>
          {showManualConnect && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 p-3 bg-[#222] rounded border border-[#333]"
            >
              <div>
                <Label htmlFor="sessionName" className="text-white/70">Session Name</Label>
                <Input
                  id="sessionName"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Enter session name"
                  className="bg-[#171717] border-[#333] text-white mt-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualConnect()}
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="text-white/70">Password (Optional)</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password if required"
                  className="bg-[#171717] border-[#333] text-white mt-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualConnect()}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleManualConnect}
                  disabled={isLoading || !sessionName.trim()}
                  className="flex-1"
                >
                  Join Session
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowManualConnect(false)}
                  className="bg-transparent border-[#333] hover:bg-[#333] text-white"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Advanced Options */}
        {showAdvancedOptions && isConnected && session && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2 p-3 bg-[#222] rounded border border-[#333]"
          >
            <div className="text-sm text-white/70 mb-2">Advanced Options</div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = getSessionUrl();
                navigator.clipboard.writeText(url);
                toast.success('Session URL copied!');
              }}
              className="w-full bg-transparent border-[#333] hover:bg-[#333] text-white text-xs"
            >
              Copy Session URL
            </Button>
            
            <div className="text-xs text-white/50 mt-2">
              Share the session URL with others to invite them to join your real-time social hub.
            </div>
          </motion.div>
        )}

        {/* Reconnection Status */}
        {reconnectTimer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-white/50 text-center"
          >
            Attempting to reconnect...
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
