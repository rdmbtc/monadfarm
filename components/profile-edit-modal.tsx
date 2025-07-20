"use client"

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';
import { User, Edit3, Check, X } from 'lucide-react';

interface ProfileEditModalProps {
  currentNickname: string;
  onNicknameChange?: (newNickname: string) => boolean;
  children: React.ReactNode;
}

export function ProfileEditModal({ 
  currentNickname, 
  onNicknameChange,
  children 
}: ProfileEditModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newNickname, setNewNickname] = useState(currentNickname);
  const [isChanging, setIsChanging] = useState(false);

  // Predefined nickname suggestions
  const suggestions = [
    "Calm Farmer",
    "Happy Farmer", 
    "Wise Farmer",
    "Green Farmer",
    "Golden Farmer",
    "Brave Farmer",
    "Swift Farmer",
    "Kind Farmer"
  ];

  const handleSave = async () => {
    if (!newNickname.trim()) return;
    
    setIsChanging(true);
    
    try {
      if (onNicknameChange) {
        const success = onNicknameChange(newNickname.trim());
        if (success) {
          setIsOpen(false);
        }
      }
    } catch (error) {
      console.error('Failed to change nickname:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const handleCancel = () => {
    setNewNickname(currentNickname);
    setIsOpen(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setNewNickname(suggestion);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-[#171717] border-[#333] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5" />
            Edit Profile
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Current Profile Info */}
          <div className="flex items-center gap-4 p-4 bg-[#111] border border-[#333] rounded-none">
            <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
              {currentNickname.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-white">{currentNickname}</p>
              <p className="text-sm text-gray-400">Current nickname</p>
            </div>
          </div>

          {/* Nickname Input */}
          <div className="space-y-2">
            <Label htmlFor="nickname" className="text-sm font-medium text-gray-300">
              New Nickname
            </Label>
            <Input
              id="nickname"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              placeholder="Enter your new nickname..."
              className="bg-[#222] border-[#333] focus:border-[#444] text-white rounded-none"
              maxLength={50}
            />
            <p className="text-xs text-gray-500">
              {newNickname.length}/50 characters
            </p>
          </div>

          {/* Nickname Suggestions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-300">
              Quick Suggestions
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((suggestion) => (
                <motion.button
                  key={suggestion}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`p-2 text-sm border rounded-none transition-colors ${
                    newNickname === suggestion
                      ? 'bg-green-600 border-green-500 text-white'
                      : 'bg-[#222] border-[#333] text-gray-300 hover:border-[#444] hover:bg-[#333]'
                  }`}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Special Highlight for Calm Farmer */}
          {newNickname === "Calm Farmer" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-green-900/20 border border-green-600/30 rounded-none"
            >
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-600/20 text-green-400">
                  ✨ Perfect Choice
                </Badge>
              </div>
              <p className="text-sm text-green-300 mt-1">
                "Calm Farmer" - A peaceful and wise choice for your farming journey! 🌾
              </p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1 bg-transparent border-[#333] hover:bg-[#222] hover:border-[#444] text-white rounded-none"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isChanging || !newNickname.trim() || newNickname === currentNickname}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-none"
            >
              {isChanging ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProfileEditModal;
