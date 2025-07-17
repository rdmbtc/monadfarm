# Multisynq Real-Time Integration for MonFarm

This document describes the Multisynq real-time synchronization integration that enables live chat and social features in MonFarm web application.

## Overview

Multisynq provides real-time collaborative functionality that allows multiple users to interact simultaneously through:
- **Live Chat**: Real-time messaging with user presence indicators
- **Social Feed**: Synchronized posts, likes, and comments across all users
- **User Presence**: Track who's online and their activity status
- **Activity Tracking**: Real-time notifications of user actions

## Architecture

The integration follows Multisynq's Model-View-Synchronizer pattern:

### Core Components

1. **Service Layer** (`services/multisynq-service.ts`)
   - Handles Multisynq initialization and configuration
   - Manages session creation and connection state
   - Provides utility functions for URL generation and QR codes

2. **Model Layer** (`lib/multisynq-chat-model.ts`)
   - Extends `Multisynq.Model` to handle application logic
   - Manages chat messages, social posts, and user data
   - Implements event handling for real-time synchronization

3. **View Layer** (`lib/multisynq-chat-view.ts`)
   - Extends `Multisynq.View` to handle UI interactions
   - Processes model updates and user input
   - Provides callbacks for React component integration

4. **React Hook** (`hooks/useMultisynq.tsx`)
   - Custom React hook for easy Multisynq integration
   - Manages connection state and provides action methods
   - Handles automatic reconnection and error management

## Components

### Main Components

- **`MonFarmSocialHub`** - Complete social hub with tabs for chat, social feed, and user management
- **`MultisynqChat`** - Dedicated chat interface with real-time messaging
- **`RealTimeSocialFeed`** - Social feed with live posts, likes, and user presence
- **`ConnectionManager`** - Connection status and session management interface

### UI Features

- Real-time message synchronization
- Live user presence indicators
- Automatic reconnection with exponential backoff
- Session sharing via URL and QR codes
- Activity feed showing user actions
- Error handling and connection status display

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the project root:

```env
# Multisynq Configuration
NEXT_PUBLIC_MULTISYNQ_API_KEY=2lHj0hCmiJV7bFST0P1aqGGUmkSDB4VqULXCwejXVX
NEXT_PUBLIC_APP_ID=com.monfarm.social
NEXT_PUBLIC_APP_NAME=MonFarm Social Hub
```

### 2. Dependencies

The integration uses the Multisynq client library loaded via CDN:
```html
<script src="https://cdn.jsdelivr.net/npm/@multisynq/client@latest/bundled/multisynq-client.min.js"></script>
```

### 3. Usage Examples

#### Basic Chat Integration

```tsx
import { MultisynqChat } from '../components/multisynq-chat';

function MyComponent() {
  return (
    <MultisynqChat 
      sessionName="my-session"
      autoConnect={true}
    />
  );
}
```

#### Social Feed Integration

```tsx
import { RealTimeSocialFeed } from '../components/real-time-social-feed';

function SocialPage() {
  return (
    <RealTimeSocialFeed 
      showUserPresence={true}
      showActivityFeed={true}
    />
  );
}
```

#### Custom Hook Usage

```tsx
import { useMultisynq } from '../hooks/useMultisynq';

function CustomComponent() {
  const {
    isConnected,
    messages,
    sendMessage,
    createPost,
    users
  } = useMultisynq({ autoConnect: true });

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Messages: {messages.length}</p>
      <p>Online Users: {users.filter(u => u.isOnline).length}</p>
    </div>
  );
}
```

## Features

### Real-Time Chat
- Instant message delivery across all connected users
- User nicknames with random generation
- System messages for user join/leave events
- Message history with automatic cleanup
- Rate limiting to prevent spam
- Command support (`/reset`, `/help`, `/users`)

### Social Features
- Real-time post creation and synchronization
- Live like/unlike functionality
- User presence indicators on posts
- Activity tracking and notifications
- Post tagging and media support
- Automatic post cleanup (keeps last 100 posts)

### User Management
- Automatic nickname assignment
- Online/offline status tracking
- User join/leave notifications
- Session-based user persistence
- Activity timestamps

### Connection Management
- Automatic reconnection with exponential backoff
- Connection state monitoring
- Error handling and user feedback
- Session URL sharing
- QR code generation for easy joining

## Testing

### Test Page
Visit `/multisynq-test` to access the comprehensive test interface:

1. **Overview Tab**: Connection status and statistics
2. **Connection Tab**: Manual connection management
3. **Chat Test Tab**: Test real-time messaging
4. **Social Test Tab**: Test social feed functionality
5. **Results Tab**: Automated test results

### Multi-Browser Testing

1. Open the application in multiple browser windows/tabs
2. Connect all instances to the same session
3. Send messages and create posts from different windows
4. Verify real-time synchronization across all instances

### Automated Tests

The test page includes automated tests for:
- Environment variable validation
- Connection establishment
- Message sending functionality
- Post creation and synchronization
- User presence tracking

## Error Handling

The integration includes comprehensive error handling:

- **Connection Errors**: Automatic retry with exponential backoff
- **API Errors**: User-friendly error messages with retry options
- **Network Issues**: Graceful degradation and reconnection
- **Rate Limiting**: Client-side rate limiting with user feedback
- **Session Errors**: Automatic session recovery

## Performance Considerations

- **Message Limits**: Keeps last 500 messages in memory
- **Post Limits**: Keeps last 100 posts in memory
- **Activity Limits**: Keeps last 50 activities in memory
- **Automatic Cleanup**: Inactive sessions are cleared after 30 minutes
- **Efficient Updates**: Only sends necessary data changes

## Security Features

- **Input Validation**: All user input is validated and sanitized
- **Rate Limiting**: Prevents message/post spam
- **Session Isolation**: Each session is isolated from others
- **Content Filtering**: Basic content moderation capabilities

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check API key in `.env` file
   - Verify internet connection
   - Check browser console for errors

2. **Messages Not Syncing**
   - Ensure all users are in the same session
   - Check connection status indicator
   - Try refreshing the page

3. **Performance Issues**
   - Clear browser cache
   - Check for JavaScript errors
   - Reduce number of open tabs

### Debug Mode

Enable debug logging by adding to your component:
```tsx
useEffect(() => {
  if (typeof window !== 'undefined' && window.Multisynq) {
    window.Multisynq.debug = true;
  }
}, []);
```

## API Reference

### useMultisynq Hook

```tsx
const {
  // Connection state
  isConnected: boolean,
  isLoading: boolean,
  error: string | null,
  session: MultisynqSession | null,
  
  // User data
  currentUser: MultisynqUser | null,
  users: MultisynqUser[],
  onlineCount: number,
  
  // Content data
  messages: ChatMessage[],
  posts: SocialPost[],
  activities: UserActivity[],
  
  // Actions
  connect: (sessionName?: string, password?: string) => Promise<void>,
  disconnect: () => void,
  sendMessage: (text: string, type?: string) => void,
  setNickname: (nickname: string) => void,
  createPost: (content: string, media?: string, tags?: string[]) => void,
  likePost: (postId: string) => void,
  resetChat: () => void,
  
  // Utilities
  getSessionUrl: () => string,
  generateQRCode: () => string,
} = useMultisynq(options);
```

## Support

For issues related to:
- **Multisynq Platform**: Visit [Multisynq Documentation](https://docs.multisynq.io/)
- **Integration Issues**: Check the test page at `/multisynq-test`
- **Feature Requests**: Create an issue in the project repository

## License

This integration is part of MonFarm project and follows the same licensing terms.
