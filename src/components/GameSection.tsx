import React from 'react';
import { Gamepad2, Trophy, Users, Zap } from 'lucide-react';

/**
 * GameSection Component
 * 
 * This component renders a gaming-focused section of the application.
 * It displays various gaming features and statistics in an attractive layout.
 * 
 * Features:
 * - Game statistics display
 * - Interactive game cards
 * - Responsive design with Tailwind CSS
 * - Modern UI with hover effects and animations
 */
const GameSection: React.FC = () => {
  // Sample game data - in a real app, this would come from props or state management
  const gameStats = [
    {
      icon: Gamepad2,
      title: "Active Games",
      value: "12",
      description: "Currently running",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Trophy,
      title: "Achievements",
      value: "47",
      description: "Unlocked rewards",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      icon: Users,
      title: "Players Online",
      value: "1,234",
      description: "Active participants",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: Zap,
      title: "High Score",
      value: "9,876",
      description: "Personal best",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Section Header */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Gaming Dashboard
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Track your gaming progress, compete with friends, and unlock new achievements
          in this comprehensive gaming experience.
        </p>
      </div>

      {/* Game Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {gameStats.map((stat, index) => {
          const IconComponent = stat.icon;
          
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon Container */}
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${stat.bgColor} mb-4`}>
                <IconComponent className={`w-6 h-6 ${stat.color}`} />
              </div>
              
              {/* Stat Content */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </h3>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {stat.title}
                </p>
                <p className="text-xs text-gray-500">
                  {stat.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Featured Game Card */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0">
            <h3 className="text-2xl font-bold mb-2">
              Featured Game Mode
            </h3>
            <p className="text-indigo-100 mb-4 max-w-md">
              Challenge yourself with our newest game mode featuring advanced AI opponents
              and dynamic difficulty scaling.
            </p>
            <button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200">
              Play Now
            </button>
          </div>
          
          {/* Decorative Game Icon */}
          <div className="relative">
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Gamepad2 className="w-12 h-12 text-white" />
            </div>
            {/* Animated pulse effect */}
            <div className="absolute inset-0 w-24 h-24 bg-white bg-opacity-10 rounded-full animate-ping"></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <button className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200">
          <Gamepad2 className="w-5 h-5" />
          Start New Game
        </button>
        <button className="flex items-center gap-2 bg-white text-gray-900 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
          <Trophy className="w-5 h-5" />
          View Leaderboard
        </button>
        <button className="flex items-center gap-2 bg-white text-gray-900 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
          <Users className="w-5 h-5" />
          Join Multiplayer
        </button>
      </div>
    </div>
  );
};

// Default export - this is what was missing and causing the error
export default GameSection;