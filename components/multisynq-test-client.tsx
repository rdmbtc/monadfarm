'use client';

import React, { useState, useEffect } from 'react';
import { useConnectedUsers, useMyId } from 'react-together';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Users, 
  CheckCircle,
  AlertCircle,
  Info,
  Loader2
} from 'lucide-react';

interface MultisynqTestClientProps {
  onDataUpdate?: (data: any) => void;
}

export function MultisynqTestClient({ onDataUpdate }: MultisynqTestClientProps) {
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // React Together hooks - only called on client side
  let myId: string | null = null;
  let connectedUsers: string[] = [];

  try {
    if (isClient) {
      myId = useMyId();
      connectedUsers = useConnectedUsers();
    }
  } catch (err) {
    console.warn('React Together hooks not available:', err);
    setError('React Together context not available');
  }

  // Derived state
  const isConnected = !!myId;
  const currentUser = myId ? {
    userId: myId,
    nickname: `User${myId.slice(-4)}`,
    isOnline: true
  } : null;
  const users = connectedUsers.map(userId => ({
    userId,
    nickname: `User${userId.slice(-4)}`,
    isOnline: true
  }));
  const onlineCount = connectedUsers.length;

  // Update parent component with data
  useEffect(() => {
    if (onDataUpdate && isClient) {
      onDataUpdate({
        isConnected,
        currentUser,
        users,
        onlineCount,
        error
      });
    }
  }, [isConnected, currentUser, users, onlineCount, error, onDataUpdate, isClient]);

  if (!isClient) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading React Together integration...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            React Together Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-500/20 bg-red-500/10">
            <AlertDescription className="text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          React Together Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Connection Status:</span>
          <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center gap-1">
            {isConnected ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Connected
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3" />
                Disconnected
              </>
            )}
          </Badge>
        </div>

        {currentUser && (
          <div className="flex items-center justify-between">
            <span>User ID:</span>
            <code className="text-sm bg-gray-800 px-2 py-1 rounded">
              {currentUser.userId.slice(0, 8)}...
            </code>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span>Online Users:</span>
          <Badge variant="outline">
            {onlineCount}
          </Badge>
        </div>

        {users.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Connected Users:</h4>
            <div className="space-y-1">
              {users.slice(0, 5).map((user) => (
                <div key={user.userId} className="flex items-center justify-between text-sm">
                  <span>{user.nickname}</span>
                  <Badge variant="outline" size="sm">
                    {user.userId === myId ? 'You' : 'Online'}
                  </Badge>
                </div>
              ))}
              {users.length > 5 && (
                <div className="text-xs text-gray-400">
                  +{users.length - 5} more users
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
