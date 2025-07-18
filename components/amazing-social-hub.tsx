"use client"

import React, { useState, useCallback, useEffect } from 'react';
import { ReactTogether, useStateTogether, useStateTogetherWithPerUserValues, useFunctionTogether, useChat, useCursors, useConnectedUsers, useNicknames, useMyId, useIsTogether, useJoinUrl, useCreateRandomSession, useLeaveSession, Chat, Cursors, ConnectedUsers, SessionManager, HoverHighlighter, utils } from 'react-together';

// Amazing Social Hub Component
export function AmazingSocialHub() {
  return (
    <ReactTogether
      sessionParams={{
        appId: 'com.monfarm.social',
        apiKey: '2lHj0hCmiJV7bFST0P1aqGGUmkSDB4VqULXCwejXVX',
        name: 'monfarm-social-hub',
      }}
      rememberUsers={true}
    >
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <SocialHubContent />
        <Cursors options={{ omitMyValue: false }} />
      </div>
    </ReactTogether>
  );
}

function SocialHubContent() {
  const isTogether = useIsTogether();
  const joinUrl = useJoinUrl();
  const connectedUsers = useConnectedUsers();
  const [myNickname, setMyNickname, allNicknames] = useNicknames();
  const myId = useMyId();
  const createRandomSession = useCreateRandomSession();
  const leaveSession = useLeaveSession();

  // Shared state for the social hub
  const [currentView, setCurrentView] = useStateTogether('current-view', 'feed');
  const [globalMessage, setGlobalMessage] = useStateTogether('global-message', '🎉 Welcome to MonFarm Social Hub!');
  
  // Per-user states
  const [myStatus, setMyStatus, allStatuses] = useStateTogetherWithPerUserValues('user-status', '🌟 Online');
  const [myMood, setMyMood, allMoods] = useStateTogetherWithPerUserValues('user-mood', '😊');
  const [myActivity, setMyActivity, allActivities] = useStateTogetherWithPerUserValues('user-activity', 'Exploring');

  // Social posts state
  const [posts, setPosts] = useStateTogether('social-posts', []);
  const [likes, setLikes] = useStateTogether('post-likes', {});

  // Collaborative drawing state
  const [drawingStrokes, setDrawingStrokes] = useStateTogether('drawing-strokes', []);

  // Global notification system
  const showGlobalNotification = useFunctionTogether('global-notification', 
    useCallback((message: string, sender: string) => {
      // Create a toast-like notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-yellow-500 text-black px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
      notification.innerHTML = `<strong>${sender}:</strong> ${message}`;
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 5000);
    }, [])
  );

  // Party mode function
  const triggerPartyMode = useFunctionTogether('party-mode',
    useCallback(() => {
      document.body.style.animation = 'rainbow 2s infinite';
      setTimeout(() => {
        document.body.style.animation = '';
      }, 5000);
    }, [])
  );

  const addPost = useCallback((content: string) => {
    const newPost = {
      id: Date.now() + Math.random(),
      author: myNickname || myId || 'Anonymous',
      authorId: myId,
      content,
      timestamp: Date.now(),
      mood: myMood
    };
    setPosts(prev => [newPost, ...prev]);
  }, [myNickname, myId, myMood, setPosts]);

  const likePost = useCallback((postId: number) => {
    setLikes(prev => ({
      ...prev,
      [postId]: (prev[postId] || 0) + 1
    }));
  }, [setLikes]);

  if (!isTogether) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-4">Connecting to MonFarm Social Hub...</h2>
          <button 
            onClick={createRandomSession}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Create New Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 bg-black/20 backdrop-blur-sm rounded-xl p-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            🚀 MonFarm Social Hub
          </h1>
          <p className="text-purple-200 mt-2">{globalMessage}</p>
        </div>
        <div className="flex items-center gap-4">
          <ConnectedUsers maxAvatars={5} />
          <SessionManager />
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
              value={myNickname}
              onChange={(e) => setMyNickname(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your nickname"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <input
              type="text"
              value={myStatus}
              onChange={(e) => setMyStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="What's your status?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Mood</label>
            <select
              value={myMood}
              onChange={(e) => setMyMood(e.target.value)}
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
        {['feed', 'chat', 'users', 'canvas'].map((view) => (
          <button
            key={view}
            onClick={() => setCurrentView(view)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
              currentView === view 
                ? 'bg-purple-600 text-white' 
                : 'text-purple-200 hover:bg-white/10'
            }`}
          >
            {view === 'feed' && '📱'} {view === 'chat' && '💬'} {view === 'users' && '👥'} {view === 'canvas' && '🎨'} {view}
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {currentView === 'feed' && <SocialFeed posts={posts} likes={likes} addPost={addPost} likePost={likePost} />}
          {currentView === 'chat' && <ChatSection />}
          {currentView === 'users' && <UsersSection allStatuses={allStatuses} allMoods={allMoods} allNicknames={allNicknames} />}
          {currentView === 'canvas' && <CollaborativeCanvas drawingStrokes={drawingStrokes} setDrawingStrokes={setDrawingStrokes} />}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <LiveActivity allActivities={allActivities} />
          <QuickActions 
            showGlobalNotification={showGlobalNotification} 
            triggerPartyMode={triggerPartyMode}
            myNickname={myNickname}
            setGlobalMessage={setGlobalMessage}
          />
          <ShareSection joinUrl={joinUrl} />
        </div>
      </div>
    </div>
  );
}

// Social Feed Component
function SocialFeed({ posts, likes, addPost, likePost }) {
  const [newPost, setNewPost] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPost.trim()) {
      addPost(newPost);
      setNewPost('');
    }
  };

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">📱 Social Feed</h2>

      {/* Post Creation */}
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Share something amazing with the community..."
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
        {posts.map((post) => (
          <HoverHighlighter key={post.id} rtKey={`post-${post.id}`} className="hover:bg-white/5 transition-colors">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-purple-300">{post.author}</span>
                  <span className="text-2xl">{post.mood}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(post.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-white mb-3">{post.content}</p>
              <button
                onClick={() => likePost(post.id)}
                className="flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors"
              >
                ❤️ {likes[post.id] || 0} likes
              </button>
            </div>
          </HoverHighlighter>
        ))}
      </div>
    </div>
  );
}

// Chat Section Component
function ChatSection() {
  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">💬 Live Chat</h2>
      <div className="h-96">
        <Chat
          rtKey="main-chat"
          chatName="🌟 MonFarm Community Chat"
          className="h-full"
        />
      </div>
    </div>
  );
}

// Users Section Component
function UsersSection({ allStatuses, allMoods, allNicknames }) {
  const connectedUsers = useConnectedUsers();

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">👥 Community Members</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {connectedUsers.map((user) => (
          <HoverHighlighter key={user.userId} rtKey={`user-${user.userId}`}>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold"
                    style={{ backgroundColor: utils.getUserColor(user.userId) }}
                  >
                    {allMoods[user.userId] || '😊'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-300">
                      {user.nickname} {user.isYou && '(You)'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {allStatuses[user.userId] || '🌟 Online'}
                    </p>
                  </div>
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </HoverHighlighter>
        ))}
      </div>
    </div>
  );
}

// Collaborative Canvas Component
function CollaborativeCanvas({ drawingStrokes, setDrawingStrokes }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#ff6b6b');
  const myId = useMyId();

  const startDrawing = (e) => {
    setIsDrawing(true);
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newStroke = {
      id: Date.now() + Math.random(),
      userId: myId,
      color: currentColor,
      points: [{ x, y }],
      timestamp: Date.now()
    };

    setDrawingStrokes(prev => [...prev, newStroke]);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDrawingStrokes(prev => {
      const newStrokes = [...prev];
      const lastStroke = newStrokes[newStrokes.length - 1];
      if (lastStroke && lastStroke.userId === myId) {
        lastStroke.points.push({ x, y });
      }
      return newStrokes;
    });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    setDrawingStrokes([]);
  };

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">🎨 Collaborative Canvas</h2>
        <div className="flex gap-2">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="w-10 h-10 rounded-lg border-2 border-white/20"
          />
          <button
            onClick={clearCanvas}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <svg
        width="100%"
        height="300"
        className="bg-white/10 rounded-lg border border-white/20 cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      >
        {drawingStrokes.map((stroke) => (
          <polyline
            key={stroke.id}
            points={stroke.points.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={stroke.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </div>
  );
}

// Live Activity Component
function LiveActivity({ allActivities }) {
  const connectedUsers = useConnectedUsers();

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4">⚡ Live Activity</h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {connectedUsers.slice(0, 5).map((user) => (
          <div key={user.userId} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{ backgroundColor: utils.getUserColor(user.userId) }}
            >
              {user.nickname.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{user.nickname}</p>
              <p className="text-xs text-gray-400">
                {allActivities[user.userId] || 'Exploring the hub'}
              </p>
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Quick Actions Component
function QuickActions({ showGlobalNotification, triggerPartyMode, myNickname, setGlobalMessage }) {
  const [notificationText, setNotificationText] = useState('');
  const [newGlobalMessage, setNewGlobalMessage] = useState('');

  const sendNotification = () => {
    if (notificationText.trim()) {
      showGlobalNotification(notificationText, myNickname || 'Anonymous');
      setNotificationText('');
    }
  };

  const updateGlobalMessage = () => {
    if (newGlobalMessage.trim()) {
      setGlobalMessage(newGlobalMessage);
      setNewGlobalMessage('');
    }
  };

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4">🚀 Quick Actions</h3>

      <div className="space-y-4">
        {/* Global Notification */}
        <div>
          <label className="block text-sm font-medium mb-2">Send Global Notification</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={notificationText}
              onChange={(e) => setNotificationText(e.target.value)}
              placeholder="Notify everyone..."
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <button
              onClick={sendNotification}
              className="bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded-lg font-semibold transition-colors text-sm"
            >
              📢
            </button>
          </div>
        </div>

        {/* Update Global Message */}
        <div>
          <label className="block text-sm font-medium mb-2">Update Welcome Message</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newGlobalMessage}
              onChange={(e) => setNewGlobalMessage(e.target.value)}
              placeholder="New welcome message..."
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <button
              onClick={updateGlobalMessage}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg font-semibold transition-colors text-sm"
            >
              ✨
            </button>
          </div>
        </div>

        {/* Party Mode */}
        <button
          onClick={triggerPartyMode}
          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 px-4 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
        >
          🎉 PARTY MODE! 🎉
        </button>
      </div>
    </div>
  );
}

// Share Section Component
function ShareSection({ joinUrl }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (joinUrl) {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4">🔗 Share & Invite</h3>

      {joinUrl ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-300">Invite friends to join this session:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm"
            />
            <button
              onClick={copyToClipboard}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {copied ? '✅' : '📋'}
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Share this link with friends to collaborate in real-time!
          </p>
        </div>
      ) : (
        <p className="text-gray-400">Not connected to a session</p>
      )}
    </div>
  );
}

// Add some custom CSS for animations
const customStyles = `
  @keyframes rainbow {
    0% { filter: hue-rotate(0deg); }
    25% { filter: hue-rotate(90deg); }
    50% { filter: hue-rotate(180deg); }
    75% { filter: hue-rotate(270deg); }
    100% { filter: hue-rotate(360deg); }
  }
`;

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}
