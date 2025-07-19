# Multisynq Integration with React Together

This document explains how to use the custom Multisynq model integration in your MonFarm application for stronger consistency guarantees in multiplayer scenarios.

## Overview

The integration combines React Together's ease of use with Multisynq's server-side logic capabilities, providing:

- **Server-side validation** for critical game actions
- **Conflict resolution** for shared resources (farm plots, coins)
- **Real-time synchronization** with consistency guarantees
- **Event-driven architecture** for scalable multiplayer features

## Architecture

```
Client Components
       ↓
useFarmGameModel Hook
       ↓
React Together + @multisynq/react
       ↓
FarmGameModel (Server-side)
       ↓
Multisynq Infrastructure
```

## Key Components

### 1. FarmGameModel (`models/farm-game-model.ts`)

A custom model that extends `ReactTogetherModel` and provides server-side logic for:

- **Player Management**: Join/leave, state updates
- **Farm Operations**: Plant/harvest with validation
- **Social Features**: Chat, posts, likes
- **Game World**: Season/weather changes, day progression

**Key Features:**
- Validates player actions (sufficient coins, plot ownership)
- Prevents conflicts (multiple players planting same plot)
- Maintains consistent game state across all clients
- Provides event-driven communication

### 2. useFarmGameModel Hook (`hooks/useFarmGameModel.ts`)

A React hook that provides easy access to the Multisynq model:

```typescript
const {
  model,           // Model instance
  players,         // All connected players
  myPlayer,        // Current player state
  sharedFarmPlots, // Shared farm grid
  chatMessages,    // Real-time chat
  socialPosts,     // Social feed
  gameSettings,    // Season, weather, etc.
  
  // Actions
  joinGame,
  plantCrop,
  harvestCrop,
  sendChatMessage,
  createSocialPost,
  // ... more actions
} = useFarmGameModel(userId, nickname)
```

### 3. MultisynqFarmDemo Component (`components/multisynq-farm-demo.tsx`)

A complete demo showcasing all features:

- **Shared Farm Grid**: 3x3 collaborative farming area
- **Real-time Chat**: Instant messaging between players
- **Social Feed**: Posts with likes and tags
- **Game Master Controls**: Season/weather management
- **Player Status**: Coins, level, inventory

## Usage Examples

### Basic Setup

1. **Install Dependencies**:
```bash
npm install @multisynq/react
```

2. **Configure Providers** (`app/providers.tsx`):
```typescript
import { FarmGameModel } from '@/models/farm-game-model'

<ReactTogether
  sessionParams={{
    appId: "monfarm-social-hub",
    apiKey: process.env.NEXT_PUBLIC_REACT_TOGETHER_API_KEY,
    name: "monfarm-social-hub-session",
    model: FarmGameModel  // Add custom model
  }}
  rememberUsers={true}
>
```

3. **Use in Components**:
```typescript
import { useFarmGameModel } from '@/hooks/useFarmGameModel'

function MyFarmComponent() {
  const { plantCrop, harvestCrop, myPlayer } = useFarmGameModel(userId, nickname)
  
  const handlePlant = (plotIndex: number) => {
    plantCrop(plotIndex, 'wheat', 10, 2) // Server validates this
  }
  
  return (
    <div>
      <p>Coins: {myPlayer?.farmCoins}</p>
      <button onClick={() => handlePlant(0)}>Plant Wheat</button>
    </div>
  )
}
```

### Advanced Features

#### Server-side Validation

The model automatically validates all actions:

```typescript
// Client tries to plant crop
plantCrop(plotIndex, 'wheat', 10, 2)

// Server checks:
// - Does player have enough coins?
// - Is the plot empty?
// - Is the plot index valid?
// Only proceeds if all checks pass
```

#### Conflict Resolution

Multiple players can't interfere with each other:

```typescript
// Player A plants on plot 0
plantCrop(0, 'wheat', 10, 2)

// Player B tries to plant on same plot - rejected by server
plantCrop(0, 'corn', 15, 3) // Fails silently, plot already occupied
```

#### Real-time Events

All events are synchronized across clients:

```typescript
// Player sends chat message
sendChatMessage("Great harvest today!")

// All connected players see it immediately
// Server can filter/validate messages
```

## Environment Variables

Make sure you have the required environment variables:

```env
NEXT_PUBLIC_REACT_TOGETHER_API_KEY=your_api_key_here
```

## Demo Page

Visit `/multisynq-demo` to see the full integration in action:

- Open multiple browser tabs/windows
- Join with different nicknames
- Try planting/harvesting crops
- Send chat messages
- Create social posts
- Use game master controls

## Benefits Over Client-only React Together

| Feature | React Together Only | With Multisynq Model |
|---------|-------------------|---------------------|
| Consistency | Eventually consistent | Strongly consistent |
| Validation | Client-side only | Server-side validation |
| Conflicts | Possible race conditions | Automatic resolution |
| Scalability | Limited by client sync | Server-side processing |
| Security | Trust all clients | Server authority |

## Best Practices

1. **Use for Critical Actions**: Plant/harvest, purchases, trades
2. **Keep UI Responsive**: Show optimistic updates, handle rejections gracefully
3. **Validate on Server**: Never trust client-side data for important operations
4. **Handle Offline**: Gracefully degrade when connection is lost
5. **Monitor Performance**: Server-side logic adds latency

## Troubleshooting

### Common Issues

1. **Model not loading**: Check that `FarmGameModel` is properly imported and registered
2. **Events not firing**: Ensure `usePublish` hooks are called with correct parameters
3. **State not updating**: Verify `useModelSelector` is watching the right state path
4. **Connection issues**: Check API key and network connectivity

### Debug Tips

```typescript
// Check model state
console.log('Model:', model)
console.log('Players:', players)
console.log('Game Settings:', gameSettings)

// Monitor events
const publishPlantCrop = usePublish((data) => {
  console.log('Publishing plant crop:', data)
  return [model?.id, 'plant-crop', data]
})
```

## Next Steps

1. **Integrate with Existing Game**: Replace local state with Multisynq model
2. **Add More Features**: Trading, guilds, competitions
3. **Optimize Performance**: Batch updates, selective synchronization
4. **Add Persistence**: Save game state to database
5. **Scale Up**: Handle thousands of concurrent players

## Resources

- [Multisynq Documentation](https://multisynq.io/docs/)
- [React Together Guide](https://reacttogether.dev/)
- [Demo Source Code](./components/multisynq-farm-demo.tsx)
