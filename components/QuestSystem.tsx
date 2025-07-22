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
    <div className="group flex items-center justify-between p-4 border border-[#333]/50 mb-3 bg-[#0a0a0a] hover:bg-[#111] hover:border-[#444] transition-all duration-200 rounded-lg">
      <div className="flex items-center flex-1">
        <div className="w-10 h-10 flex items-center justify-center mr-4 bg-gradient-to-br from-[#222] to-[#111] rounded-lg border border-[#333]/50">
          {getQuestIcon(quest.icon)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-white font-medium text-sm">{quest.title}</div>
            {getTypeIcon(quest.type)}
            {isExternal && <ExternalLink className="h-3 w-3 text-blue-400" />}
          </div>
          <div className="text-white/60 text-xs mb-2">{quest.description}</div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                quest.completed ? 'bg-gradient-to-r from-green-500 to-green-400' :
                progressPercentage >= 100 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 'bg-gradient-to-r from-blue-500 to-blue-400'
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>

          {/* Progress Text */}
          <div className="text-xs text-white/50 mt-1.5 flex items-center justify-between">
            <span>
              {isCommunityQuest && showCommunityProgress ? (
                <>
                  Community: {quest.communityProgress}/{quest.communityMaxProgress}
                  {quest.participantCount > 0 && (
                    <span className="ml-2 text-blue-400">({quest.participantCount} players)</span>
                  )}
                </>
              ) : (
                `${quest.progress}/${quest.maxProgress}`
              )}
            </span>

            {/* Expiry Info */}
            {quest.expiresAt && (
              <span className="text-orange-400">
                Expires: {new Date(quest.expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-4">
        {/* Rewards */}
        <div className="flex items-center gap-3 text-white/80">
          {quest.reward.coins && (
            <div className="flex items-center bg-[#222] px-2 py-1 rounded-md">
              <Coins className="h-3 w-3 mr-1 text-yellow-400" />
              <span className="text-xs font-medium">{quest.reward.coins}</span>
            </div>
          )}
          {quest.reward.xp && (
            <div className="flex items-center bg-[#222] px-2 py-1 rounded-md">
              <Sparkles className="h-3 w-3 mr-1 text-purple-400" />
              <span className="text-xs font-medium">{quest.reward.xp}</span>
            </div>
          )}
        </div>

        {/* Complete Button */}
        {!quest.completed && (
          <button
            onClick={() => onComplete(quest.id)}
            disabled={!canComplete && !isExternal}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
              canComplete || isExternal
                ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg hover:shadow-green-500/25'
                : 'bg-[#333] text-white/50 cursor-not-allowed'
            }`}
          >
            {isExternal ? 'Visit' : canComplete ? 'Complete' : 'Locked'}
          </button>
        )}

        {quest.completed && (
          <div className="px-4 py-2 text-xs font-medium bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg shadow-lg">
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
    // Compact view for sidebar/smaller spaces with minimalistic design
    return (
      <div className="space-y-4">
        {showTitle && (
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-white font-semibold">Active Quests</h3>
          </div>
        )}

        {/* Show only incomplete quests in compact mode */}
        <div className="space-y-3">
          {[...dailyQuests, ...socialQuests, ...weeklyQuests]
            .filter((quest: Quest) => !quest.completed)
            .slice(0, 3)
            .map((quest: Quest) => (
              <QuestCard key={quest.id} quest={quest} onComplete={completeQuest} />
            ))}

          {communityQuests.filter((quest: CommunityQuest) => !quest.completed).slice(0, 1).map((quest: CommunityQuest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onComplete={completeQuest}
              showCommunityProgress={true}
            />
          ))}
        </div>
      </div>
    )
  }

  // Full quest system view with minimalistic design
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Daily Quests */}
      <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-[#333]/50 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#111] to-[#0a0a0a] p-6 border-b border-[#333]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">Daily Quests</h2>
                <p className="text-white/60 text-sm">Resets every 24 hours</p>
              </div>
            </div>
            <Calendar className="h-5 w-5 text-blue-400" />
          </div>
        </div>
        <div className="p-6">
          {dailyQuests.map((quest: Quest) => (
            <QuestCard key={quest.id} quest={quest} onComplete={completeQuest} />
          ))}
        </div>
      </div>

      {/* Social Quests */}
      <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-[#333]/50 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#111] to-[#0a0a0a] p-6 border-b border-[#333]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3">
                <ExternalLink className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">Social Quests</h2>
                <p className="text-white/60 text-sm">Connect with the community</p>
              </div>
            </div>
            <Globe className="h-5 w-5 text-green-400" />
          </div>
        </div>
        <div className="p-6">
          {socialQuests.map((quest: Quest) => (
            <QuestCard key={quest.id} quest={quest} onComplete={completeQuest} />
          ))}
        </div>
      </div>

      {/* Weekly Quests */}
      <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-[#333]/50 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#111] to-[#0a0a0a] p-6 border-b border-[#333]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">Weekly Quests</h2>
                <p className="text-white/60 text-sm">Resets every 7 days</p>
              </div>
            </div>
            <Clock className="h-5 w-5 text-purple-400" />
          </div>
        </div>
        <div className="p-6">
          {weeklyQuests.map((quest: Quest) => (
            <QuestCard key={quest.id} quest={quest} onComplete={completeQuest} />
          ))}
        </div>
      </div>

      {/* Community Quests */}
      <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-[#333]/50 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#111] to-[#0a0a0a] p-6 border-b border-[#333]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">Community Quests</h2>
                <p className="text-white/60 text-sm">
                  Work together with {connectedUsers.length} players
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                sessionStatus === 'online'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {sessionStatus === 'online' ? '● Online' : '● Offline'}
              </span>
            </div>
          </div>
        </div>
        <div className="p-6">
          {communityQuests.map((quest: CommunityQuest) => (
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
