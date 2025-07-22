import React from 'react'
import { Trophy, Sparkles, Coins, Users, ExternalLink, Globe, Calendar, Clock } from 'lucide-react'
import { Quest, CommunityQuest, useQuestSystem } from '../hooks/useQuestSystem'

interface QuestCardProps {
  quest: Quest | CommunityQuest
  onComplete: (questId: string) => void
  showCommunityProgress?: boolean
}

const QuestCard: React.FC<QuestCardProps> = ({ quest, onComplete, showCommunityProgress = false }) => {
  const isCommunityQuest = 'communityProgress' in quest
  const progressPercentage = isCommunityQuest && showCommunityProgress 
    ? (quest.communityProgress / quest.communityMaxProgress) * 100
    : (quest.progress / quest.maxProgress) * 100

  const getQuestIcon = (iconString: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      '🌱': <Sparkles className="h-4 w-4 text-green-400" />,
      '🌾': <Trophy className="h-4 w-4 text-yellow-400" />,
      '🐦': <ExternalLink className="h-4 w-4 text-blue-400" />,
      '🏆': <Trophy className="h-4 w-4 text-purple-400" />,
      '🌍': <Globe className="h-4 w-4 text-blue-500" />,
      '🎉': <Users className="h-4 w-4 text-pink-400" />
    }
    return iconMap[iconString] || <Sparkles className="h-4 w-4 text-white" />
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'daily': return <Calendar className="h-3 w-3 text-blue-400" />
      case 'weekly': return <Clock className="h-3 w-3 text-purple-400" />
      case 'social': return <ExternalLink className="h-3 w-3 text-green-400" />
      case 'community': return <Users className="h-3 w-3 text-pink-400" />
      default: return <Sparkles className="h-3 w-3 text-white" />
    }
  }

  const canComplete = quest.progress >= quest.maxProgress && !quest.completed
  const isExternal = quest.type === 'social' && quest.externalLink

  return (
    <div className="flex items-center justify-between p-3 border border-[#333] mb-2 bg-[#111] noot-text hover:bg-[#1a1a1a] transition-colors">
      <div className="flex items-center flex-1">
        <div className="w-8 h-8 border border-[#333] flex items-center justify-center mr-3 bg-[#222]">
          {getQuestIcon(quest.icon)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="text-white font-medium">{quest.title}</div>
            {getTypeIcon(quest.type)}
            {isExternal && <ExternalLink className="h-3 w-3 text-blue-400" />}
          </div>
          <div className="text-white/60 text-xs mb-1">{quest.description}</div>
          
          {/* Progress Bar */}
          <div className="w-full h-1 bg-[#222] rounded">
            <div 
              className={`h-full rounded transition-all duration-300 ${
                quest.completed ? 'bg-green-500' : 
                progressPercentage >= 100 ? 'bg-yellow-500' : 'bg-white'
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          
          {/* Progress Text */}
          <div className="text-xs text-white/50 mt-1">
            {isCommunityQuest && showCommunityProgress ? (
              <>
                Community: {quest.communityProgress}/{quest.communityMaxProgress}
                {quest.participantCount > 0 && (
                  <span className="ml-2">({quest.participantCount} players)</span>
                )}
              </>
            ) : (
              `${quest.progress}/${quest.maxProgress}`
            )}
          </div>
          
          {/* Expiry Info */}
          {quest.expiresAt && (
            <div className="text-xs text-orange-400 mt-1">
              Expires: {new Date(quest.expiresAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Rewards */}
        <div className="flex items-center gap-2 text-white/80">
          {quest.reward.coins && (
            <div className="flex items-center">
              <Coins className="h-3 w-3 mr-1 text-yellow-400" />
              <span className="text-xs">{quest.reward.coins}</span>
            </div>
          )}
          {quest.reward.xp && (
            <div className="flex items-center">
              <Sparkles className="h-3 w-3 mr-1 text-purple-400" />
              <span className="text-xs">{quest.reward.xp}</span>
            </div>
          )}
        </div>
        
        {/* Complete Button */}
        {!quest.completed && (
          <button
            onClick={() => onComplete(quest.id)}
            disabled={!canComplete && !isExternal}
            className={`px-3 py-1 text-xs rounded transition-all ${
              canComplete || isExternal
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-[#333] text-white/50 cursor-not-allowed'
            }`}
          >
            {isExternal ? 'Visit' : canComplete ? 'Complete' : 'Locked'}
          </button>
        )}
        
        {quest.completed && (
          <div className="px-3 py-1 text-xs bg-green-600 text-white rounded">
            ✓ Done
          </div>
        )}
      </div>
    </div>
  )
}

interface QuestSystemProps {
  showTitle?: boolean
  compact?: boolean
}

export const QuestSystem: React.FC<QuestSystemProps> = ({ showTitle = true, compact = false }) => {
  const {
    completeQuest,
    getDailyQuests,
    getWeeklyQuests,
    getSocialQuests,
    getCommunityQuests,
    connectedUsers,
    sessionStatus
  } = useQuestSystem()

  const dailyQuests = getDailyQuests()
  const weeklyQuests = getWeeklyQuests()
  const socialQuests = getSocialQuests()
  const communityQuests = getCommunityQuests()

  if (compact) {
    // Compact view for sidebar/smaller spaces
    return (
      <div className="space-y-3">
        {showTitle && (
          <h3 className="text-white font-bold flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Active Quests
          </h3>
        )}
        
        {/* Show only incomplete quests in compact mode */}
        {[...dailyQuests, ...socialQuests, ...weeklyQuests]
          .filter(quest => !quest.completed)
          .slice(0, 3)
          .map(quest => (
            <QuestCard key={quest.id} quest={quest} onComplete={completeQuest} />
          ))}
        
        {communityQuests.filter(quest => !quest.completed).slice(0, 1).map(quest => (
          <QuestCard 
            key={quest.id} 
            quest={quest} 
            onComplete={completeQuest} 
            showCommunityProgress={true}
          />
        ))}
      </div>
    )
  }

  // Full quest system view
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
      {/* Daily Quests */}
      <div className="noot-card">
        <div className="border-b border-[#333] p-4">
          <h2 className="noot-header flex items-center text-white noot-title">
            <Sparkles className="h-5 w-5 mr-2" />
            Daily Quests
          </h2>
          <p className="text-white/60 text-sm noot-text">
            Resets every 24 hours
          </p>
        </div>
        <div className="p-4">
          {dailyQuests.map(quest => (
            <QuestCard key={quest.id} quest={quest} onComplete={completeQuest} />
          ))}
        </div>
      </div>

      {/* Social Quests */}
      <div className="noot-card">
        <div className="border-b border-[#333] p-4">
          <h2 className="noot-header flex items-center text-white noot-title">
            <ExternalLink className="h-5 w-5 mr-2" />
            Social Quests
          </h2>
          <p className="text-white/60 text-sm noot-text">
            Connect with the community
          </p>
        </div>
        <div className="p-4">
          {socialQuests.map(quest => (
            <QuestCard key={quest.id} quest={quest} onComplete={completeQuest} />
          ))}
        </div>
      </div>

      {/* Weekly Quests */}
      <div className="noot-card">
        <div className="border-b border-[#333] p-4">
          <h2 className="noot-header flex items-center text-white noot-title">
            <Trophy className="h-5 w-5 mr-2" />
            Weekly Quests
          </h2>
          <p className="text-white/60 text-sm noot-text">
            Resets every 7 days
          </p>
        </div>
        <div className="p-4">
          {weeklyQuests.map(quest => (
            <QuestCard key={quest.id} quest={quest} onComplete={completeQuest} />
          ))}
        </div>
      </div>

      {/* Community Quests */}
      <div className="noot-card">
        <div className="border-b border-[#333] p-4">
          <h2 className="noot-header flex items-center text-white noot-title">
            <Users className="h-5 w-5 mr-2" />
            Community Quests
          </h2>
          <p className="text-white/60 text-sm noot-text">
            Work together with {connectedUsers.length} players
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              sessionStatus === 'online' ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {sessionStatus === 'online' ? 'Online' : 'Offline'}
            </span>
          </p>
        </div>
        <div className="p-4">
          {communityQuests.map(quest => (
            <QuestCard 
              key={quest.id} 
              quest={quest} 
              onComplete={completeQuest} 
              showCommunityProgress={true}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default QuestSystem
