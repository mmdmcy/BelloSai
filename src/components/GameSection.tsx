import React, { useState } from 'react';
import { ArrowLeft, Trophy, Brain, Gamepad2, Users, Clock, Star } from 'lucide-react';
import { CustomizationSettings } from '../App';
import GameShow from './GameShow';
import Quiz from './Quiz';

interface GameSectionProps {
  isDark: boolean;
  customization: CustomizationSettings;
  onBackToChat: () => void;
  onToggleTheme: () => void;
}

export default function GameSection({ isDark, customization, onBackToChat, onToggleTheme }: GameSectionProps) {
  const [selectedGame, setSelectedGame] = useState<'gameshow' | 'quiz' | null>(null);

  if (selectedGame === 'gameshow') {
    return (
      <GameShow
        isDark={isDark}
        customization={customization}
        onBack={() => setSelectedGame(null)}
        onBackToChat={onBackToChat}
        onToggleTheme={onToggleTheme}
      />
    );
  }

  if (selectedGame === 'quiz') {
    return (
      <Quiz
        isDark={isDark}
        customization={customization}
        onBack={() => setSelectedGame(null)}
        onBackToChat={onBackToChat}
        onToggleTheme={onToggleTheme}
      />
    );
  }

  return (
    <div 
      className={`h-screen ${isDark ? 'bg-gray-900' : 'bg-purple-50'}`}
      style={{ 
        fontFamily: customization.fontFamily,
        background: customization.gradientEnabled && !isDark 
          ? `linear-gradient(135deg, ${customization.primaryColor}05, ${customization.secondaryColor}05)`
          : undefined
      }}
    >
      {/* Header */}
      <div 
        className="h-16 flex items-center justify-between px-6 text-white"
        style={{ 
          background: customization.gradientEnabled 
            ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
            : customization.primaryColor
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToChat}
            className="p-2 rounded-lg transition-colors bg-white/10 hover:bg-white/20 text-white"
            title="Back to Chat"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-6 h-6" />
            <h1 className="text-xl font-semibold" style={{ fontFamily: customization.fontFamily }}>
              BelloSai Games
            </h1>
          </div>
        </div>
        
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg transition-colors bg-white/10 hover:bg-white/20 text-white"
        >
          {isDark ? (
            <svg className="w-5 h-5\" fill="currentColor\" viewBox="0 0 24 24">
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h2 
              className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
              style={{ 
                fontFamily: customization.fontFamily,
                color: isDark 
                  ? (customization.primaryColor !== '#7c3aed' ? customization.primaryColor : undefined)
                  : customization.primaryColor
              }}
            >
              Choose Your Game
            </h2>
            <p 
              className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              style={{ fontFamily: customization.fontFamily }}
            >
              Challenge yourself with AI-powered games and quizzes
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* GameShow Panel */}
            <div 
              className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-105 cursor-pointer ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              style={{
                background: customization.gradientEnabled && !isDark 
                  ? `linear-gradient(135deg, ${customization.primaryColor}10, ${customization.secondaryColor}05)`
                  : undefined
              }}
              onClick={() => setSelectedGame('gameshow')}
            >
              {/* Background Pattern */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  background: `radial-gradient(circle at 20% 80%, ${customization.primaryColor}40 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${customization.secondaryColor}40 0%, transparent 50%)`
                }}
              />
              
              <div className="relative p-8">
                <div className="flex items-center justify-between mb-6">
                  <div 
                    className="p-4 rounded-full"
                    style={{ 
                      background: customization.gradientEnabled 
                        ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                        : customization.primaryColor
                    }}
                  >
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <Star className="w-5 h-5 text-yellow-500" />
                    <Star className="w-5 h-5 text-yellow-500" />
                    <Star className="w-5 h-5 text-yellow-500" />
                    <Star className="w-5 h-5 text-gray-300" />
                  </div>
                </div>
                
                <h3 
                  className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
                  style={{ fontFamily: customization.fontFamily }}
                >
                  GameShow
                </h3>
                
                <p 
                  className={`text-base mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                  style={{ fontFamily: customization.fontFamily }}
                >
                  Compete against AI in an exciting game show format with multiple rounds, challenges, and prizes!
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <Users className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span 
                      className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                      style={{ fontFamily: customization.fontFamily }}
                    >
                      1v1 AI Competition
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span 
                      className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                      style={{ fontFamily: customization.fontFamily }}
                    >
                      15-20 minutes
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Trophy className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span 
                      className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                      style={{ fontFamily: customization.fontFamily }}
                    >
                      Multiple Rounds & Prizes
                    </span>
                  </div>
                </div>
                
                <button 
                  className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors hover:opacity-90"
                  style={{ 
                    background: customization.gradientEnabled 
                      ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                      : customization.primaryColor,
                    fontFamily: customization.fontFamily
                  }}
                >
                  Start GameShow
                </button>
              </div>
            </div>

            {/* Quiz Panel */}
            <div 
              className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-105 cursor-pointer ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              style={{
                background: customization.gradientEnabled && !isDark 
                  ? `linear-gradient(135deg, ${customization.secondaryColor}10, ${customization.primaryColor}05)`
                  : undefined
              }}
              onClick={() => setSelectedGame('quiz')}
            >
              {/* Background Pattern */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  background: `radial-gradient(circle at 80% 20%, ${customization.primaryColor}40 0%, transparent 50%), radial-gradient(circle at 20% 80%, ${customization.secondaryColor}40 0%, transparent 50%)`
                }}
              />
              
              <div className="relative p-8">
                <div className="flex items-center justify-between mb-6">
                  <div 
                    className="p-4 rounded-full"
                    style={{ 
                      background: customization.gradientEnabled 
                        ? `linear-gradient(135deg, ${customization.secondaryColor}, ${customization.primaryColor})`
                        : customization.secondaryColor
                    }}
                  >
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <Star className="w-5 h-5 text-yellow-500" />
                    <Star className="w-5 h-5 text-yellow-500" />
                    <Star className="w-5 h-5 text-yellow-500" />
                    <Star className="w-5 h-5 text-yellow-500" />
                  </div>
                </div>
                
                <h3 
                  className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
                  style={{ fontFamily: customization.fontFamily }}
                >
                  Quiz
                </h3>
                
                <p 
                  className={`text-base mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                  style={{ fontFamily: customization.fontFamily }}
                >
                  Test your knowledge with fun trivia questions across various topics and difficulty levels.
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <Brain className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span 
                      className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                      style={{ fontFamily: customization.fontFamily }}
                    >
                      Multiple Categories
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span 
                      className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                      style={{ fontFamily: customization.fontFamily }}
                    >
                      5-10 minutes
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span 
                      className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                      style={{ fontFamily: customization.fontFamily }}
                    >
                      Score & Achievements
                    </span>
                  </div>
                </div>
                
                <button 
                  className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors hover:opacity-90"
                  style={{ 
                    background: customization.gradientEnabled 
                      ? `linear-gradient(135deg, ${customization.secondaryColor}, ${customization.primaryColor})`
                      : customization.secondaryColor,
                    fontFamily: customization.fontFamily
                  }}
                >
                  Start Quiz
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <p 
              className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              style={{ fontFamily: customization.fontFamily }}
            >
              More games coming soon! Challenge yourself and have fun with AI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}