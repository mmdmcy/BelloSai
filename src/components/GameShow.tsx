import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Clock, Zap, Star, Target, Award } from 'lucide-react';
import { CustomizationSettings } from '../App';

interface GameShowProps {
  isDark: boolean;
  customization: CustomizationSettings;
  onBack: () => void;
  onBackToChat: () => void;
  onToggleTheme: () => void;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export default function GameShow({ isDark, customization, onBack, onBackToChat, onToggleTheme }: GameShowProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'finished'>('intro');
  const [currentRound, setCurrentRound] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const questions: Question[] = [
    {
      id: 1,
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correct: 2,
      category: "Geography",
      difficulty: "easy",
      points: 100
    },
    {
      id: 2,
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correct: 1,
      category: "Science",
      difficulty: "easy",
      points: 100
    },
    {
      id: 3,
      question: "What is the largest mammal in the world?",
      options: ["African Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
      correct: 1,
      category: "Nature",
      difficulty: "medium",
      points: 200
    },
    {
      id: 4,
      question: "In which year did World War II end?",
      options: ["1944", "1945", "1946", "1947"],
      correct: 1,
      category: "History",
      difficulty: "medium",
      points: 200
    },
    {
      id: 5,
      question: "What is the chemical symbol for gold?",
      options: ["Go", "Gd", "Au", "Ag"],
      correct: 2,
      category: "Science",
      difficulty: "hard",
      points: 300
    }
  ];

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult) {
      handleAnswer(null);
    }
  }, [timeLeft, gameState, showResult]);

  const startGame = () => {
    setGameState('playing');
    setCurrentRound(1);
    setCurrentQuestion(0);
    setPlayerScore(0);
    setAiScore(0);
    setTimeLeft(30);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleAnswer = (answerIndex: number | null) => {
    if (showResult) return;

    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    const question = questions[currentQuestion];
    const correct = answerIndex === question.correct;
    setIsCorrect(correct);

    if (correct) {
      setPlayerScore(prev => prev + question.points);
    }

    // AI answers (simulate AI performance)
    const aiCorrect = Math.random() > 0.3; // AI gets 70% correct
    if (aiCorrect) {
      setAiScore(prev => prev + question.points);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setTimeLeft(30);
        setSelectedAnswer(null);
        setShowResult(false);
        
        if ((currentQuestion + 1) % 2 === 0) {
          setCurrentRound(prev => prev + 1);
        }
      } else {
        setGameState('finished');
      }
    }, 3000);
  };

  const getWinner = () => {
    if (playerScore > aiScore) return 'player';
    if (aiScore > playerScore) return 'ai';
    return 'tie';
  };

  if (gameState === 'intro') {
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
              onClick={onBack}
              className="p-2 rounded-lg transition-colors bg-white/10 hover:bg-white/20 text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              <h1 className="text-xl font-semibold">GameShow Challenge</h1>
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

        {/* Intro Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-2xl text-center">
            <div 
              className="w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center"
              style={{ 
                background: customization.gradientEnabled 
                  ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                  : customization.primaryColor
              }}
            >
              <Trophy className="w-12 h-12 text-white" />
            </div>
            
            <h2 
              className={`text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}
              style={{ 
                color: isDark 
                  ? (customization.primaryColor !== '#7c3aed' ? customization.primaryColor : undefined)
                  : customization.primaryColor
              }}
            >
              Welcome to GameShow Challenge!
            </h2>
            
            <p className={`text-lg mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Compete against our AI in an exciting trivia challenge. Answer questions across multiple categories and see who comes out on top!
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <Zap className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
                <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Fast-Paced</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>30 seconds per question</p>
              </div>
              
              <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <Target className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Multiple Categories</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Science, History, Geography & more</p>
              </div>
              
              <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <Award className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
                <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Points System</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>100-300 points per question</p>
              </div>
            </div>
            
            <button 
              onClick={startGame}
              className="px-8 py-4 text-lg font-semibold text-white rounded-lg transition-colors hover:opacity-90"
              style={{ 
                background: customization.gradientEnabled 
                  ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                  : customization.primaryColor
              }}
            >
              Start Challenge
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    const winner = getWinner();
    
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
              onClick={onBack}
              className="p-2 rounded-lg transition-colors bg-white/10 hover:bg-white/20 text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">Game Results</h1>
          </div>
          
          <button
            onClick={onBackToChat}
            className="px-4 py-2 rounded-lg transition-colors bg-white/10 hover:bg-white/20 text-white"
          >
            Back to Chat
          </button>
        </div>

        {/* Results Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-2xl text-center">
            <div 
              className="w-32 h-32 mx-auto mb-8 rounded-full flex items-center justify-center"
              style={{ 
                background: winner === 'player' 
                  ? customization.gradientEnabled 
                    ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                    : customization.primaryColor
                  : winner === 'ai'
                    ? '#ef4444'
                    : '#6b7280'
              }}
            >
              {winner === 'player' ? (
                <Trophy className="w-16 h-16 text-white" />
              ) : winner === 'ai' ? (
                <svg className="w-16 h-16 text-white\" fill="currentColor\" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              ) : (
                <Star className="w-16 h-16 text-white" />
              )}
            </div>
            
            <h2 
              className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
              style={{ 
                color: isDark 
                  ? (customization.primaryColor !== '#7c3aed' ? customization.primaryColor : undefined)
                  : customization.primaryColor
              }}
            >
              {winner === 'player' ? 'Congratulations!' : winner === 'ai' ? 'Good Try!' : 'It\'s a Tie!'}
            </h2>
            
            <p className={`text-lg mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {winner === 'player' 
                ? 'You defeated the AI! Excellent performance!' 
                : winner === 'ai' 
                  ? 'The AI won this time, but you did great!' 
                  : 'You and the AI are evenly matched!'}
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Your Score</h3>
                <p 
                  className="text-3xl font-bold"
                  style={{ 
                    color: customization.gradientEnabled 
                      ? customization.primaryColor
                      : customization.primaryColor
                  }}
                >
                  {playerScore}
                </p>
              </div>
              
              <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Score</h3>
                <p className="text-3xl font-bold text-red-500">{aiScore}</p>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <button 
                onClick={startGame}
                className="px-6 py-3 font-semibold text-white rounded-lg transition-colors hover:opacity-90"
                style={{ 
                  background: customization.gradientEnabled 
                    ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                    : customization.primaryColor
                }}
              >
                Play Again
              </button>
              
              <button 
                onClick={onBack}
                className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Back to Games
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Playing state
  const question = questions[currentQuestion];
  
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
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            <span className="font-semibold">Round {currentRound}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs opacity-75">You</div>
              <div className="font-bold">{playerScore}</div>
            </div>
            <div className="text-xs opacity-75">vs</div>
            <div className="text-center">
              <div className="text-xs opacity-75">AI</div>
              <div className="font-bold">{aiScore}</div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span className="font-bold text-lg">{timeLeft}s</span>
          </div>
          
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg transition-colors bg-white/10 hover:bg-white/20 text-white"
          >
            Exit Game
          </button>
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <span 
                className={`px-3 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
              >
                {question.category}
              </span>
              <span 
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}
              >
                {question.difficulty.toUpperCase()} • {question.points} pts
              </span>
            </div>
            
            <h2 
              className={`text-2xl font-bold mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              {question.question}
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showResult}
                className={`p-6 text-left rounded-lg border-2 transition-all ${
                  showResult
                    ? index === question.correct
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : selectedAnswer === index
                        ? 'border-red-500 bg-red-50 text-red-800'
                        : isDark ? 'border-gray-700 bg-gray-800 text-gray-400' : 'border-gray-200 bg-gray-100 text-gray-500'
                    : selectedAnswer === index
                      ? isDark ? 'border-blue-400 bg-blue-900/20 text-blue-300' : 'border-blue-500 bg-blue-50 text-blue-800'
                      : isDark ? 'border-gray-700 bg-gray-800 text-white hover:border-gray-600' : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      showResult && index === question.correct
                        ? 'bg-green-500 text-white'
                        : showResult && selectedAnswer === index && index !== question.correct
                          ? 'bg-red-500 text-white'
                          : selectedAnswer === index
                            ? isDark ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white'
                            : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
              </button>
            ))}
          </div>
          
          {showResult && (
            <div className="text-center mt-8">
              <div 
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {isCorrect ? (
                  <>
                    <svg className="w-5 h-5\" fill="currentColor\" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span className="font-semibold">Correct! +{question.points} points</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    <span className="font-semibold">
                      {selectedAnswer === null ? 'Time\'s up!' : 'Incorrect!'} The answer was {question.options[question.correct]}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}