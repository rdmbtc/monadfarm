'use client'

import React from 'react'
import { useConnectedUsers } from 'react-together'
import { Users, Play, Settings, Crown, Wifi, WifiOff } from 'lucide-react'
import { UsePlatformerGameModelReturn } from '../../hooks/usePlatformerGameModel'

interface GameLobbyProps {
  gameData: UsePlatformerGameModelReturn
  myId: string | null
  currentNickname: string
  onStartGame: () => void
  onChangeGameMode: (mode: 'single' | 'online') => void
}

export default function GameLobby({
  gameData,
  myId,
  currentNickname,
  onStartGame,
  onChangeGameMode
}: GameLobbyProps) {
  const connectedUsers = useConnectedUsers()
  const {
    players,
    gameSession,
    canStartGame,
    playerCount
  } = gameData

  const isHost = gameSession && Object.keys(players).length > 0 && 
                 Object.keys(players)[0] === myId // First player is the host

  const currentPlayMode = gameSession?.playMode || 'online'
  const requiredPlayers = gameSession?.requiredPlayers || 2
  const canStart = canStartGame()

  // Get list of players with their connection status
  const playerList = Object.values(players).map(player => ({
    ...player,
    isConnected: connectedUsers.some(user => user.id === player.id),
    isHost: Object.keys(players)[0] === player.id
  }))

  return (
    <div className="bg-gray-900 rounded-lg p-6 max-w-2xl mx-auto">
      {/* Lobby Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Game Lobby</h2>
        <p className="text-gray-400">
          {currentPlayMode === 'single' 
            ? 'Single Player Mode - Collect 1 star to advance'
            : 'Online Mode - All players must collect stars to advance'
          }
        </p>
      </div>

      {/* Game Mode Selector (Host Only) */}
      {isHost && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Game Settings
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => onChangeGameMode('single')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                currentPlayMode === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Single Player
            </button>
            <button
              onClick={() => onChangeGameMode('online')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                currentPlayMode === 'online'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Online Mode
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {currentPlayMode === 'single' 
              ? 'Play alone, advance when you collect any star'
              : `Play together, all ${requiredPlayers} players must collect stars to advance`
            }
          </p>
        </div>
      )}

      {/* Player List */}
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Players ({playerCount}/{gameSession?.maxPlayers || 4})
        </h3>
        
        <div className="space-y-2">
          {playerList.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {/* Player Avatar/Color */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: player.color }}
                >
                  {player.nickname.charAt(0).toUpperCase()}
                </div>
                
                {/* Player Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">
                      {player.nickname}
                    </span>
                    {player.isHost && (
                      <Crown className="h-4 w-4 text-yellow-500" title="Host" />
                    )}
                    {player.id === myId && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    Level {player.level} • Score: {player.score}
                  </div>
                </div>
              </div>

              {/* Connection Status */}
              <div className="flex items-center gap-2">
                {player.isConnected ? (
                  <div className="flex items-center gap-1 text-green-400">
                    <Wifi className="h-4 w-4" />
                    <span className="text-xs">Online</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-400">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-xs">Offline</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Waiting for Players Message */}
        {playerCount < requiredPlayers && (
          <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
            <p className="text-yellow-400 text-sm text-center">
              Waiting for {requiredPlayers - playerCount} more player{requiredPlayers - playerCount !== 1 ? 's' : ''} to join...
            </p>
          </div>
        )}
      </div>

      {/* Start Game Button */}
      <div className="text-center">
        <button
          onClick={onStartGame}
          disabled={!canStart}
          className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 mx-auto transition-colors ${
            canStart
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Play className="h-5 w-5" />
          Start Game
        </button>
        
        {!canStart && (
          <p className="text-xs text-gray-400 mt-2">
            {playerCount < requiredPlayers 
              ? `Need ${requiredPlayers - playerCount} more player${requiredPlayers - playerCount !== 1 ? 's' : ''} to start`
              : 'Game cannot be started'
            }
          </p>
        )}
      </div>

      {/* Lobby Instructions */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <h4 className="text-white font-medium mb-2">How to Play:</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Use arrow keys or WASD to move and jump</li>
          <li>• Collect stars to advance to the next level</li>
          {currentPlayMode === 'single' ? (
            <li>• <strong>Single Player:</strong> Collect any star to advance</li>
          ) : (
            <li>• <strong>Online Mode:</strong> All players must collect stars before advancing</li>
          )}
          <li>• Avoid enemies and hazards</li>
          <li>• Work together to reach higher levels!</li>
        </ul>
      </div>
    </div>
  )
}
