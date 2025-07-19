"use client"

import React, { useState, useEffect } from 'react'
import { useFarmGameModel, useCurrentUser } from '@/hooks/useFarmGameModel'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { 
  Sprout, 
  Coins, 
  Users, 
  MessageCircle, 
  Heart,
  Sun,
  Cloud,
  CloudRain,
  Calendar,
  Leaf
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function MultisynqFarmDemo() {
  const { userId, nickname } = useCurrentUser()
  const [chatInput, setChatInput] = useState('')
  const [postInput, setPostInput] = useState('')
  const [selectedCrop, setSelectedCrop] = useState('wheat')
  
  const {
    model,
    players,
    myPlayer,
    sharedFarmPlots,
    chatMessages,
    socialPosts,
    gameSettings,
    joinGame,
    plantCrop,
    harvestCrop,
    sendChatMessage,
    createSocialPost,
    likeSocialPost,
    changeSeason,
    changeWeather,
    advanceDay
  } = useFarmGameModel(userId || undefined, nickname || undefined)

  // Auto-join game when component mounts
  useEffect(() => {
    if (userId && nickname && model && !myPlayer) {
      joinGame(nickname)
    }
  }, [userId, nickname, model, myPlayer, joinGame])

  const crops = [
    { type: 'wheat', name: 'Wheat', cost: 10, growthTime: 2, emoji: '🌾' },
    { type: 'corn', name: 'Corn', cost: 15, growthTime: 3, emoji: '🌽' },
    { type: 'tomato', name: 'Tomato', cost: 20, growthTime: 4, emoji: '🍅' },
    { type: 'carrot', name: 'Carrot', cost: 8, growthTime: 1.5, emoji: '🥕' }
  ]

  const selectedCropData = crops.find(c => c.type === selectedCrop)

  const handlePlantCrop = (plotIndex: number) => {
    if (!selectedCropData || !myPlayer) return
    
    if (myPlayer.farmCoins < selectedCropData.cost) {
      alert('Not enough coins!')
      return
    }

    plantCrop(
      plotIndex, 
      selectedCropData.type, 
      selectedCropData.cost, 
      selectedCropData.growthTime,
      true // Use shared farm
    )
  }

  const handleHarvestCrop = (plotIndex: number) => {
    harvestCrop(plotIndex, true) // Use shared farm
  }

  const handleSendChat = () => {
    if (chatInput.trim()) {
      sendChatMessage(chatInput.trim())
      setChatInput('')
    }
  }

  const handleCreatePost = () => {
    if (postInput.trim()) {
      createSocialPost(postInput.trim(), undefined, ['farming', 'multisynq'])
      setPostInput('')
    }
  }

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'sunny': return <Sun className="h-4 w-4 text-yellow-500" />
      case 'rainy': return <CloudRain className="h-4 w-4 text-blue-500" />
      default: return <Cloud className="h-4 w-4 text-gray-500" />
    }
  }

  const getPlotStatus = (plot: any) => {
    if (plot.status === 'empty') return '🟫'
    if (plot.status === 'growing') {
      const crop = crops.find(c => c.type === plot.crop)
      return crop ? `🌱 ${crop.emoji}` : '🌱'
    }
    if (plot.status === 'ready') {
      const crop = crops.find(c => c.type === plot.crop)
      return crop ? `✨ ${crop.emoji}` : '✨'
    }
    return '❓'
  }

  if (!model) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p>Connecting to Multisynq Farm...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-green-600 mb-2">🌾 Multisynq Farm Demo</h1>
        <p className="text-gray-600">Real-time collaborative farming with server-side consistency</p>
      </div>

      {/* Game Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Farm Coins</p>
                <p className="text-lg font-bold">{myPlayer?.farmCoins || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Players Online</p>
                <p className="text-lg font-bold">{Object.keys(players).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Leaf className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Season</p>
                <p className="text-lg font-bold capitalize">{gameSettings.currentSeason}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {getWeatherIcon(gameSettings.currentWeather)}
              <div>
                <p className="text-sm text-gray-600">Weather</p>
                <p className="text-lg font-bold capitalize">{gameSettings.currentWeather}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shared Farm */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sprout className="h-5 w-5" />
              <span>Shared Farm (3x3)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Crop Selection */}
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Select Crop to Plant:</p>
              <div className="flex flex-wrap gap-2">
                {crops.map((crop) => (
                  <Button
                    key={crop.type}
                    variant={selectedCrop === crop.type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCrop(crop.type)}
                    className="text-xs"
                  >
                    {crop.emoji} {crop.name} ({crop.cost} coins)
                  </Button>
                ))}
              </div>
            </div>

            {/* Farm Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {sharedFarmPlots.map((plot, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className={cn(
                    "h-16 text-lg",
                    plot.status === 'ready' && "bg-green-100 hover:bg-green-200",
                    plot.status === 'growing' && "bg-yellow-100 hover:bg-yellow-200"
                  )}
                  onClick={() => {
                    if (plot.status === 'empty') {
                      handlePlantCrop(index)
                    } else if (plot.status === 'ready' && plot.ownerId === userId) {
                      handleHarvestCrop(index)
                    }
                  }}
                  disabled={plot.status === 'growing' || (plot.status === 'ready' && plot.ownerId !== userId)}
                >
                  <div className="text-center">
                    <div>{getPlotStatus(plot)}</div>
                    {plot.ownerId && (
                      <div className="text-xs text-gray-500 mt-1">
                        {players[plot.ownerId]?.nickname || 'Unknown'}
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>

            <p className="text-xs text-gray-600">
              Click empty plots to plant {selectedCropData?.emoji} {selectedCropData?.name}. 
              You can only harvest crops you planted.
            </p>
          </CardContent>
        </Card>

        {/* Chat & Social */}
        <div className="space-y-4">
          {/* Chat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Farm Chat</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32 mb-4">
                <div className="space-y-2">
                  {chatMessages.slice(-10).map((message) => (
                    <div key={message.id} className="text-sm">
                      <span className="font-medium text-blue-600">{message.nickname}:</span>{' '}
                      <span className={message.type === 'system' ? 'text-green-600' : ''}>
                        {message.text}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex space-x-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                />
                <Button onClick={handleSendChat} size="sm">Send</Button>
              </div>
            </CardContent>
          </Card>

          {/* Social Posts */}
          <Card>
            <CardHeader>
              <CardTitle>Social Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  value={postInput}
                  onChange={(e) => setPostInput(e.target.value)}
                  placeholder="Share your farming experience..."
                  className="mb-2"
                />
                <Button onClick={handleCreatePost} size="sm" className="w-full">
                  Create Post
                </Button>
              </div>
              
              <ScrollArea className="h-40">
                <div className="space-y-3">
                  {socialPosts.slice(0, 5).map((post) => (
                    <div key={post.id} className="border rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm">{post.nickname}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(post.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{post.content}</p>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => likeSocialPost(post.id)}
                          className="text-xs"
                        >
                          <Heart className={cn(
                            "h-3 w-3 mr-1",
                            post.likedBy.includes(userId || '') && "fill-red-500 text-red-500"
                          )} />
                          {post.likes}
                        </Button>
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Admin Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Game Master Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => changeSeason('spring')} size="sm" variant="outline">
              🌸 Spring
            </Button>
            <Button onClick={() => changeSeason('summer')} size="sm" variant="outline">
              ☀️ Summer
            </Button>
            <Button onClick={() => changeSeason('fall')} size="sm" variant="outline">
              🍂 Fall
            </Button>
            <Button onClick={() => changeSeason('winter')} size="sm" variant="outline">
              ❄️ Winter
            </Button>
            <Separator orientation="vertical" className="h-8" />
            <Button onClick={() => changeWeather('sunny')} size="sm" variant="outline">
              ☀️ Sunny
            </Button>
            <Button onClick={() => changeWeather('rainy')} size="sm" variant="outline">
              🌧️ Rainy
            </Button>
            <Button onClick={() => changeWeather('cloudy')} size="sm" variant="outline">
              ☁️ Cloudy
            </Button>
            <Separator orientation="vertical" className="h-8" />
            <Button onClick={advanceDay} size="sm" variant="outline">
              <Calendar className="h-4 w-4 mr-1" />
              Advance Day
            </Button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Day {gameSettings.seasonDay} of {gameSettings.seasonLength} in {gameSettings.currentSeason}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
