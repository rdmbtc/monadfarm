"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Check, X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useToast } from '../hooks/use-toast'

interface NicknameSetupProps {
  onNicknameSet: (nickname: string) => void
  onSkip?: () => void
  defaultNickname?: string
  isRequired?: boolean
}

export function NicknameSetup({ 
  onNicknameSet, 
  onSkip, 
  defaultNickname = "", 
  isRequired = false 
}: NicknameSetupProps) {
  const [nickname, setNickname] = useState(defaultNickname)
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState("")
  const { toast } = useToast()

  const validateNickname = (name: string): boolean => {
    if (name.length < 3) {
      setValidationError("Nickname must be at least 3 characters long")
      return false
    }
    if (name.length > 20) {
      setValidationError("Nickname must be less than 20 characters")
      return false
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      setValidationError("Nickname can only contain letters, numbers, underscores, and hyphens")
      return false
    }
    setValidationError("")
    return true
  }

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNickname(value)
    if (value) {
      validateNickname(value)
    } else {
      setValidationError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nickname.trim()) {
      setValidationError("Please enter a nickname")
      return
    }

    if (!validateNickname(nickname)) {
      return
    }

    setIsValidating(true)
    
    try {
      // Simulate nickname availability check
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onNicknameSet(nickname)
      
      toast({
        title: "Nickname Set!",
        description: `Welcome to the Social Hub, ${nickname}!`,
      })
    } catch (error) {
      setValidationError("Failed to set nickname. Please try again.")
    } finally {
      setIsValidating(false)
    }
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <Card className="bg-[#171717] border border-[#333] rounded-none max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 bg-[#111] border border-[#333] rounded-full w-20 h-20 flex items-center justify-center">
            <User className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Choose Your Farmer Name</CardTitle>
          <p className="text-white/70 text-sm">
            This is how other farmers will see you in the Social Hub
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter your nickname..."
                value={nickname}
                onChange={handleNicknameChange}
                className="bg-[#111] border-[#333] text-white placeholder:text-white/50 rounded-none"
                maxLength={20}
                autoFocus
              />
              {validationError && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  {validationError}
                </motion.p>
              )}
              {nickname && !validationError && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-green-400 text-sm flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Looks good!
                </motion.p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={!nickname || !!validationError || isValidating}
                className="flex-1 bg-white text-black hover:bg-white/90 rounded-none"
              >
                {isValidating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 border-2 border-black border-t-transparent rounded-full"
                  />
                ) : (
                  "Set Nickname"
                )}
              </Button>
              
              {!isRequired && onSkip && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  className="bg-transparent border-[#333] text-white hover:bg-[#222] rounded-none"
                >
                  Skip
                </Button>
              )}
            </div>
          </form>

          <div className="mt-4 p-3 bg-[#111] border border-[#333] rounded-none">
            <p className="text-white/60 text-xs">
              💡 <strong>Tip:</strong> Choose a unique name that represents your farming style! 
              You can change it later in your profile settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
