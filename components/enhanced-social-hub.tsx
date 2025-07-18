"use client"

import React, { useState, useCallback, useEffect } from 'react';
import { useMultisynq } from '../hooks/useMultisynq';
import { MultisynqChat } from './multisynq-chat';

// Enhanced Social Hub using existing Multisynq infrastructure
export function EnhancedSocialHub() {
  const {
    isConnected,
    isLoading,
    error,
    session,
    currentUser,
    users,
    onlineCount,
    messages,
    posts,
    activities,
    connect,
    disconnect,
    sendMessage,
    setNickname,
    createPost,
    likePost,
    savePost,
    resetChat
  } = useMultisynq({
    autoConnect: true,
    sessionName: 'monfarm-enhanced-social-hub'
  });

  const [currentView, setCurrentView] = useState('feed');
  const [newPost, setNewPost] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [userStatus, setUserStatus] = useState('🌟 Online');
  const [userMood, setUserMood] = useState('😊');

  // Handle post creation
  const handleCreatePost = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (newPost.trim()) {
      createPost(newPost, undefined, [userMood]);
      setNewPost('');
    }
  }, [newPost, createPost, userMood]);

  // Handle message sending
  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  }, [newMessage, sendMessage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-4">Connecting to MonFarm Social Hub...</h2>
          <p className="text-purple-200">Initializing real-time collaboration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center bg-black/20 backdrop-blur-sm rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4 text-red-400">Connection Error</h2>
          <p className="text-red-200 mb-6">{error}</p>
          <button 
            onClick={() => connect()}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 bg-black/20 backdrop-blur-sm rounded-xl p-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              🚀 MonFarm Enhanced Social Hub
            </h1>
            <p className="text-purple-200 mt-2">
              {isConnected ? `Connected to ${session?.name || 'session'}` : 'Not connected'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">{onlineCount} online</span>
            </div>
            <button
              onClick={disconnect}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Disconnect
            </button>
          </div>
        </header>

        {/* User Profile Section */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">👤 Your Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nickname</label>
              <input
                type="text"
                value={currentUser?.nickname || ''}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your nickname"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <input
                type="text"
                value={userStatus}
                onChange={(e) => setUserStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="What's your status?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mood</label>
              <select
                value={userMood}
                onChange={(e) => setUserMood(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="😊">😊 Happy</option>
                <option value="🤔">🤔 Thinking</option>
                <option value="🎉">🎉 Excited</option>
                <option value="😴">😴 Sleepy</option>
                <option value="🔥">🔥 On Fire</option>
                <option value="🌟">🌟 Stellar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex gap-2 mb-6 bg-black/20 backdrop-blur-sm rounded-xl p-2">
          {['feed', 'chat', 'users', 'activity'].map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                currentView === view 
                  ? 'bg-purple-600 text-white' 
                  : 'text-purple-200 hover:bg-white/10'
              }`}
            >
              {view === 'feed' && '📱'} {view === 'chat' && '💬'} {view === 'users' && '👥'} {view === 'activity' && '⚡'} {view}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {currentView === 'feed' && (
              <SocialFeed 
                posts={posts} 
                newPost={newPost}
                setNewPost={setNewPost}
                handleCreatePost={handleCreatePost}
                likePost={likePost}
                userMood={userMood}
              />
            )}
            {currentView === 'chat' && (
              <ChatSection 
                messages={messages}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                handleSendMessage={handleSendMessage}
                resetChat={resetChat}
              />
            )}
            {currentView === 'users' && <UsersSection users={users} currentUser={currentUser} />}
            {currentView === 'activity' && <ActivitySection activities={activities} />}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <OnlineUsers users={users} onlineCount={onlineCount} />
            <SessionInfo session={session} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Social Feed Component
function SocialFeed({ posts, newPost, setNewPost, handleCreatePost, likePost, userMood }) {
  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">📱 Social Feed</h2>
      
      {/* Post Creation */}
      <form onSubmit={handleCreatePost} className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{userMood}</span>
          <span className="text-sm text-gray-400">Share your thoughts...</span>
        </div>
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="What's happening in MonFarm today?"
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          rows={3}
        />
        <button
          type="submit"
          className="mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-2 rounded-lg font-semibold transition-all transform hover:scale-105"
        >
          🚀 Share Post
        </button>
      </form>

      {/* Posts */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {posts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-purple-300">{post.nickname}</span>
                  <span className="text-2xl">{post.tags?.[0] || '😊'}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(post.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-white mb-3">{post.content}</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => likePost(post.id)}
                  className="flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors"
                >
                  ❤️ {post.likes || 0} likes
                </button>
                <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                  💬 Reply
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Chat Section Component
function ChatSection({ messages, newMessage, setNewMessage, handleSendMessage, resetChat }) {
  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">💬 Live Chat</h2>
        <button
          onClick={resetChat}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-semibold transition-colors"
        >
          Clear Chat
        </button>
      </div>
      
      {/* Messages */}
      <div className="bg-white/5 rounded-lg p-4 h-64 overflow-y-auto mb-4 border border-white/10">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-purple-300">{message.nickname}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-white bg-white/5 rounded px-3 py-1">{message.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}

// Users Section Component
function UsersSection({ users, currentUser }) {
  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">👥 Community Members</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No other users online</p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.userId} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold">
                    {user.nickname?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-300">
                      {user.nickname || 'Anonymous'} {user.userId === currentUser?.userId && '(You)'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {user.isOnline ? '🟢 Online' : '🔴 Offline'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    Joined {new Date(user.joinedAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Activity Section Component
function ActivitySection({ activities }) {
  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">⚡ Recent Activity</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No recent activity</p>
          </div>
        ) : (
          activities.slice(0, 20).map((activity, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold text-purple-300">{activity.nickname}</span>
                    <span className="text-gray-300"> {getActivityText(activity.action)}</span>
                    {activity.target && <span className="text-blue-300"> "{activity.target}"</span>}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Online Users Sidebar Component
function OnlineUsers({ users, onlineCount }) {
  const onlineUsers = users.filter(user => user.isOnline);

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4">🟢 Online Now ({onlineCount})</h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {onlineUsers.length === 0 ? (
          <p className="text-gray-400 text-sm">No other users online</p>
        ) : (
          onlineUsers.map((user) => (
            <div key={user.userId} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-sm font-bold">
                {user.nickname?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{user.nickname || 'Anonymous'}</p>
                <p className="text-xs text-gray-400">Active now</p>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Session Info Sidebar Component
function SessionInfo({ session }) {
  const [copied, setCopied] = useState(false);

  const copySessionInfo = async () => {
    if (session) {
      const sessionInfo = `Join MonFarm Social Hub!\nSession: ${session.name}\nURL: ${window.location.href}`;
      await navigator.clipboard.writeText(sessionInfo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4">🔗 Session Info</h3>

      {session ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Session Name</label>
            <p className="text-purple-300 font-mono text-sm bg-white/5 rounded px-2 py-1">
              {session.name}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Session ID</label>
            <p className="text-gray-400 font-mono text-xs bg-white/5 rounded px-2 py-1">
              {session.id || 'N/A'}
            </p>
          </div>

          <button
            onClick={copySessionInfo}
            className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {copied ? '✅ Copied!' : '📋 Share Session'}
          </button>

          <p className="text-xs text-gray-400">
            Share this session with friends to collaborate in real-time!
          </p>
        </div>
      ) : (
        <p className="text-gray-400">Not connected to a session</p>
      )}
    </div>
  );
}

// Helper functions
function getActivityIcon(action: string): string {
  switch (action) {
    case 'joined': return '👋';
    case 'left': return '👋';
    case 'posted': return '📝';
    case 'liked': return '❤️';
    case 'commented': return '💬';
    default: return '⚡';
  }
}

function getActivityText(action: string): string {
  switch (action) {
    case 'joined': return 'joined the session';
    case 'left': return 'left the session';
    case 'posted': return 'created a new post';
    case 'liked': return 'liked a post';
    case 'commented': return 'commented on';
    default: return 'performed an action';
  }
}
