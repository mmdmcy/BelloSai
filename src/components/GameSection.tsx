/**
 * GameSection Component
 * 
 * This component renders the gaming section of the application with two main panels:
 * - Gameshow: Interactive AI-powered game show experience (Family Feud style)
 * - Quiz: Fun quiz games with various topics
 * 
 * Features:
 * - Two distinct gaming modes with actual gameplay
 * - Responsive card-based layout
 * - Theme-aware styling
 * - Navigation back to main chat
 * - Attractive hover effects and animations
 * - Sample game implementations with AI vs Player mechanics
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Brain, Users, Zap, Sun, Moon, Play, Clock, Target, CheckCircle, XCircle, Star } from 'lucide-react';
import { CustomizationSettings } from '../App';

interface GameSectionProps {
  isDark: boolean;
  customization: CustomizationSettings;
  onBackToChat: () => void;
  onToggleTheme: () => void;
}

// Sample gameshow questions (Family Feud style)
const gameshowQuestions = [
  {
    question: "Name something people do when they can't sleep",
    answers: [
      { text: "Read a book", points: 32 },
      { text: "Watch TV", points: 28 },
      { text: "Count sheep", points: 18 },
      { text: "Listen to music", points: 12 },
      { text: "Get a snack", points: 10 }
    ]
  },
  {
    question: "Name a popular pizza topping",
    answers: [
      { text: "Pepperoni", points: 45 },
      { text: "Cheese", points: 25 },
      { text: "Mushrooms", points: 15 },
      { text: "Sausage", points: 10 },
      { text: "Peppers", points: 5 }
    ]
  }
];

// Sample quiz questions
const quizQuestions = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correct: 2,
    category: "Geography"
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correct: 1,
    category: "Science"
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Picasso", "Da Vinci", "Monet"],
    correct: 2,
    category: "Art"
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correct: 3,
    category: "Geography"
  },
  {
    question: "In which year did World War II end?",
    options: ["1944", "1945", "1946", "1947"],
    correct: 1,
    category: "History"
  }
];

export default function GameSection({ 
  isDark, 
  customization, 
  onBackToChat, 
  onToggleTheme 
}: GameSectionProps) {
  
  // State to track which game mode is selected
  const [selectedGame, setSelectedGame] = useState<'gameshow' | 'quiz' | null>(null);
  
  // Gameshow state
  const [gameshowState, setGameshowState] = useState({
    currentQuestion: 0,
    playerScore: 0,
    aiScore: 0,
    revealedAnswers: [] as number[],
    strikes: 0,
    gamePhase: 'playing' as 'playing' | 'finished',
    playerGuess: '',
    lastGuessResult: null as 'correct' | 'incorrect' | null,
    round: 1
  });

  // Quiz state
  const [quizState, setQuizState] = useState({
    currentQuestion: 0,
    playerScore: 0,
    aiScore: 0,
    timeLeft: 15,
    selectedAnswer: null as number | null,
    showResult: false,
    gamePhase: 'playing' as 'playing' | 'finished',
    playerAnswers: [] as boolean[],
    aiAnswers: [] as boolean[]
  });

  // Timer for quiz
  useEffect(() => {
    if (selectedGame === 'quiz' && quizState.gamePhase === 'playing' && !quizState.showResult && quizState.timeLeft > 0) {
      const timer = setTimeout(() => {
        setQuizState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (selectedGame === 'quiz' && quizState.timeLeft === 0 && !quizState.showResult) {
      // Time's up - auto submit
      handleQuizAnswer(null);
    }
  }, [selectedGame, quizState.timeLeft, quizState.showResult, quizState.gamePhase]);

  /**
   * Handle gameshow selection
   * Shows a sample gameshow interface
   */
  const handleGameshowClick = () => {
    setSelectedGame('gameshow');
    // Reset gameshow state
    setGameshowState({
      currentQuestion: 0,
      playerScore: 0,
      aiScore: 0,
      revealedAnswers: [],
      strikes: 0,
      gamePhase: 'playing',
      playerGuess: '',
      lastGuessResult: null,
      round: 1
    });
  };

  /**
   * Handle quiz selection
   * Shows a sample quiz interface
   */
  const handleQuizClick = () => {
    setSelectedGame('quiz');
    // Reset quiz state
    setQuizState({
      currentQuestion: 0,
      playerScore: 0,
      aiScore: 0,
      timeLeft: 15,
      selectedAnswer: null,
      showResult: false,
      gamePhase: 'playing',
      playerAnswers: [],
      aiAnswers: []
    });
  };

  /**
   * Handle going back to game selection
   */
  const handleBackToGames = () => {
    setSelectedGame(null);
  };

  /**
   * Handle gameshow guess submission
   */
  const handleGameshowGuess = () => {
    if (!gameshowState.playerGuess.trim()) return;

    const currentQ = gameshowQuestions[gameshowState.currentQuestion];
    const guess = gameshowState.playerGuess.toLowerCase().trim();
    
    // Check if guess matches any answer
    const matchedAnswer = currentQ.answers.findIndex(answer => 
      answer.text.toLowerCase().includes(guess) || guess.includes(answer.text.toLowerCase())
    );

    if (matchedAnswer !== -1 && !gameshowState.revealedAnswers.includes(matchedAnswer)) {
      // Correct guess!
      setGameshowState(prev => ({
        ...prev,
        revealedAnswers: [...prev.revealedAnswers, matchedAnswer],
        playerScore: prev.playerScore + currentQ.answers[matchedAnswer].points,
        lastGuessResult: 'correct',
        playerGuess: ''
      }));

      // AI makes a guess after player
      setTimeout(() => {
        simulateAIGameshowGuess();
      }, 1500);
    } else {
      // Incorrect guess
      setGameshowState(prev => ({
        ...prev,
        strikes: prev.strikes + 1,
        lastGuessResult: 'incorrect',
        playerGuess: ''
      }));

      // Check if game over (3 strikes)
      if (gameshowState.strikes >= 2) {
        setTimeout(() => {
          setGameshowState(prev => ({ ...prev, gamePhase: 'finished' }));
        }, 1000);
      } else {
        // AI gets a turn
        setTimeout(() => {
          simulateAIGameshowGuess();
        }, 1500);
      }
    }
  };

  /**
   * Simulate AI making a gameshow guess
   */
  const simulateAIGameshowGuess = () => {
    const currentQ = gameshowQuestions[gameshowState.currentQuestion];
    const unrevealedAnswers = currentQ.answers.filter((_, index) => 
      !gameshowState.revealedAnswers.includes(index)
    );

    if (unrevealedAnswers.length > 0) {
      // AI has 70% chance to get it right
      const aiSuccess = Math.random() < 0.7;
      
      if (aiSuccess) {
        const randomAnswer = Math.floor(Math.random() * unrevealedAnswers.length);
        const answerIndex = currentQ.answers.findIndex(answer => answer === unrevealedAnswers[randomAnswer]);
        
        setGameshowState(prev => ({
          ...prev,
          revealedAnswers: [...prev.revealedAnswers, answerIndex],
          aiScore: prev.aiScore + currentQ.answers[answerIndex].points
        }));
      }
    }

    // Check if all answers revealed or move to next question
    setTimeout(() => {
      if (gameshowState.revealedAnswers.length >= 4 || gameshowState.currentQuestion >= gameshowQuestions.length - 1) {
        setGameshowState(prev => ({ ...prev, gamePhase: 'finished' }));
      }
    }, 2000);
  };

  /**
   * Handle quiz answer selection
   */
  const handleQuizAnswer = (answerIndex: number | null) => {
    const currentQ = quizQuestions[quizState.currentQuestion];
    const isCorrect = answerIndex === currentQ.correct;
    
    // Simulate AI answer (80% accuracy)
    const aiCorrect = Math.random() < 0.8;
    
    setQuizState(prev => ({
      ...prev,
      selectedAnswer: answerIndex,
      showResult: true,
      playerScore: prev.playerScore + (isCorrect ? 10 : 0),
      aiScore: prev.aiScore + (aiCorrect ? 10 : 0),
      playerAnswers: [...prev.playerAnswers, isCorrect],
      aiAnswers: [...prev.aiAnswers, aiCorrect]
    }));

    // Move to next question after showing result
    setTimeout(() => {
      if (quizState.currentQuestion >= quizQuestions.length - 1) {
        setQuizState(prev => ({ ...prev, gamePhase: 'finished' }));
      } else {
        setQuizState(prev => ({
          ...prev,
          currentQuestion: prev.currentQuestion + 1,
          timeLeft: 15,
          selectedAnswer: null,
          showResult: false
        }));
      }
    }, 3000);
  };

  // Sample Gameshow Interface (Family Feud Style)
  if (selectedGame === 'gameshow') {
    const currentQ = gameshowQuestions[gameshowState.currentQuestion];
    
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
          className="h-16 border-b flex items-center justify-between px-6 text-white"
          style={{ 
            background: customization.gradientEnabled 
              ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
              : customization.primaryColor
          }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToGames}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Games
            </button>
            <h1 className="text-xl font-semibold">AI Family Feud</h1>
          </div>
          
          <button onClick={onToggleTheme} className="p-2 rounded-lg transition-colors bg-white/10 hover:bg-white/20 text-white">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Game Content */}
        <div className="flex-1 p-8">
          {gameshowState.gamePhase === 'playing' ? (
            <div className="max-w-6xl mx-auto">
              {/* Score Board */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className={`p-6 rounded-xl text-center ${isDark ? 'bg-blue-900' : 'bg-blue-100'}`}>
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>You</h3>
                  <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-blue-900'}`}>{gameshowState.playerScore}</div>
                </div>
                
                <div className={`p-6 rounded-xl text-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Round {gameshowState.round}</h3>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3].map(i => (
                      <div 
                        key={i}
                        className={`w-6 h-6 rounded-full ${
                          i <= gameshowState.strikes ? 'bg-red-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Strikes</div>
                </div>
                
                <div className={`p-6 rounded-xl text-center ${isDark ? 'bg-red-900' : 'bg-red-100'}`}>
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-red-200' : 'text-red-800'}`}>AI</h3>
                  <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-red-900'}`}>{gameshowState.aiScore}</div>
                </div>
              </div>

              {/* Question */}
              <div className={`p-8 rounded-xl mb-8 text-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {currentQ.question}
                </h2>
                
                {/* Answer Board */}
                <div className="grid grid-cols-1 gap-3 max-w-2xl mx-auto">
                  {currentQ.answers.map((answer, index) => (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                        gameshowState.revealedAnswers.includes(index)
                          ? isDark ? 'bg-green-800 border-green-600' : 'bg-green-100 border-green-400'
                          : isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          gameshowState.revealedAnswers.includes(index)
                            ? 'bg-green-500 text-white'
                            : isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <span className={`text-lg font-medium ${
                          gameshowState.revealedAnswers.includes(index)
                            ? isDark ? 'text-white' : 'text-green-800'
                            : isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {gameshowState.revealedAnswers.includes(index) ? answer.text : '???'}
                        </span>
                      </div>
                      <div className={`text-xl font-bold ${
                        gameshowState.revealedAnswers.includes(index)
                          ? isDark ? 'text-white' : 'text-green-800'
                          : isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {gameshowState.revealedAnswers.includes(index) ? answer.points : '??'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input Section */}
              <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <div className="max-w-2xl mx-auto">
                  <h3 className={`text-lg font-semibold mb-4 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Your Turn! Make a guess:
                  </h3>
                  
                  {gameshowState.lastGuessResult && (
                    <div className={`mb-4 p-3 rounded-lg text-center ${
                      gameshowState.lastGuessResult === 'correct'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {gameshowState.lastGuessResult === 'correct' ? '✅ Great guess!' : '❌ Not on the board!'}
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={gameshowState.playerGuess}
                      onChange={(e) => setGameshowState(prev => ({ ...prev, playerGuess: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleGameshowGuess()}
                      placeholder="Enter your answer..."
                      className={`flex-1 p-3 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2`}
                      style={{ '--tw-ring-color': customization.primaryColor } as React.CSSProperties}
                    />
                    <button
                      onClick={handleGameshowGuess}
                      disabled={!gameshowState.playerGuess.trim()}
                      className="px-6 py-3 rounded-lg font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                      style={{ 
                        background: customization.gradientEnabled 
                          ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                          : customization.primaryColor
                      }}
                    >
                      Guess
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Game Over Screen
            <div className="flex items-center justify-center h-full">
              <div className={`p-8 rounded-2xl text-center max-w-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
                <Trophy className="w-16 h-16 mx-auto mb-6 text-yellow-500" />
                <h2 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Game Over!
                </h2>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <div className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>You</div>
                    <div className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{gameshowState.playerScore}</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>AI</div>
                    <div className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{gameshowState.aiScore}</div>
                  </div>
                </div>
                
                <div className={`text-xl mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {gameshowState.playerScore > gameshowState.aiScore ? '🎉 You Won!' : 
                   gameshowState.playerScore < gameshowState.aiScore ? '🤖 AI Wins!' : '🤝 It\'s a Tie!'}
                </div>
                
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleGameshowClick}
                    className="px-6 py-3 rounded-lg font-semibold text-white transition-colors hover:opacity-90"
                    style={{ 
                      background: customization.gradientEnabled 
                        ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                        : customization.primaryColor
                    }}
                  >
                    Play Again
                  </button>
                  <button
                    onClick={handleBackToGames}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
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
          )}
        </div>
      </div>
    );
  }

  // Sample Quiz Interface
  if (selectedGame === 'quiz') {
    const currentQ = quizQuestions[quizState.currentQuestion];
    
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
          className="h-16 border-b flex items-center justify-between px-6 text-white"
          style={{ 
            background: customization.gradientEnabled 
              ? `linear-gradient(135deg, ${customization.secondaryColor}, ${customization.primaryColor})`
              : customization.secondaryColor
          }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToGames}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Games
            </button>
            <h1 className="text-xl font-semibold">AI Quiz Challenge</h1>
          </div>
          
          <button onClick={onToggleTheme} className="p-2 rounded-lg transition-colors bg-white/10 hover:bg-white/20 text-white">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Quiz Content */}
        <div className="flex-1 p-8">
          {quizState.gamePhase === 'playing' ? (
            <div className="max-w-4xl mx-auto">
              {/* Progress and Score */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Question</div>
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {quizState.currentQuestion + 1}/{quizQuestions.length}
                  </div>
                </div>
                
                <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-blue-900' : 'bg-blue-100'}`}>
                  <div className={`text-sm font-medium mb-1 ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>Your Score</div>
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-blue-900'}`}>{quizState.playerScore}</div>
                </div>
                
                <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-red-900' : 'bg-red-100'}`}>
                  <div className={`text-sm font-medium mb-1 ${isDark ? 'text-red-200' : 'text-red-700'}`}>AI Score</div>
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-red-900'}`}>{quizState.aiScore}</div>
                </div>
                
                <div className={`p-4 rounded-xl text-center ${
                  quizState.timeLeft <= 5 ? 'bg-red-500' : isDark ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <div className={`text-sm font-medium mb-1 ${
                    quizState.timeLeft <= 5 ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Time</div>
                  <div className={`text-2xl font-bold ${
                    quizState.timeLeft <= 5 ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'
                  }`}>{quizState.timeLeft}s</div>
                </div>
              </div>

              {/* Question */}
              <div className={`p-8 rounded-xl mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <div className="text-center mb-6">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                    isDark ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {currentQ.category}
                  </div>
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {currentQ.question}
                  </h2>
                </div>

                {/* Answer Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                  {currentQ.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => !quizState.showResult && handleQuizAnswer(index)}
                      disabled={quizState.showResult}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        quizState.showResult
                          ? index === currentQ.correct
                            ? 'bg-green-100 border-green-400 text-green-800'
                            : index === quizState.selectedAnswer && index !== currentQ.correct
                              ? 'bg-red-100 border-red-400 text-red-800'
                              : isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-600'
                          : quizState.selectedAnswer === index
                            ? isDark ? 'bg-purple-800 border-purple-600 text-white' : 'bg-purple-100 border-purple-400 text-purple-800'
                            : isDark ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-900 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          quizState.showResult && index === currentQ.correct
                            ? 'bg-green-500 text-white'
                            : quizState.showResult && index === quizState.selectedAnswer && index !== currentQ.correct
                              ? 'bg-red-500 text-white'
                              : quizState.selectedAnswer === index
                                ? 'bg-purple-500 text-white'
                                : isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="text-lg">{option}</span>
                        {quizState.showResult && index === currentQ.correct && (
                          <CheckCircle className="w-6 h-6 text-green-500 ml-auto" />
                        )}
                        {quizState.showResult && index === quizState.selectedAnswer && index !== currentQ.correct && (
                          <XCircle className="w-6 h-6 text-red-500 ml-auto" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Result Display */}
                {quizState.showResult && (
                  <div className="mt-6 text-center">
                    <div className={`text-lg font-semibold mb-2 ${
                      quizState.selectedAnswer === currentQ.correct ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {quizState.selectedAnswer === currentQ.correct ? '✅ Correct!' : 
                       quizState.selectedAnswer === null ? '⏰ Time\'s up!' : '❌ Incorrect!'}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      AI also answered {quizState.aiAnswers[quizState.aiAnswers.length - 1] ? 'correctly' : 'incorrectly'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Quiz Complete Screen
            <div className="flex items-center justify-center h-full">
              <div className={`p-8 rounded-2xl text-center max-w-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
                <Brain className="w-16 h-16 mx-auto mb-6" style={{ color: customization.secondaryColor }} />
                <h2 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Quiz Complete!
                </h2>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <div className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>You</div>
                    <div className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{quizState.playerScore}</div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {quizState.playerAnswers.filter(Boolean).length}/{quizQuestions.length} correct
                    </div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>AI</div>
                    <div className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{quizState.aiScore}</div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {quizState.aiAnswers.filter(Boolean).length}/{quizQuestions.length} correct
                    </div>
                  </div>
                </div>
                
                <div className={`text-xl mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {quizState.playerScore > quizState.aiScore ? '🎉 You Won!' : 
                   quizState.playerScore < quizState.aiScore ? '🤖 AI Wins!' : '🤝 It\'s a Tie!'}
                </div>
                
                {/* Performance Stars */}
                <div className="flex justify-center gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star}
                      className={`w-8 h-8 ${
                        star <= Math.ceil((quizState.playerScore / (quizQuestions.length * 10)) * 5)
                          ? 'text-yellow-400 fill-current'
                          : isDark ? 'text-gray-600' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleQuizClick}
                    className="px-6 py-3 rounded-lg font-semibold text-white transition-colors hover:opacity-90"
                    style={{ 
                      background: customization.gradientEnabled 
                        ? `linear-gradient(135deg, ${customization.secondaryColor}, ${customization.primaryColor})`
                        : customization.secondaryColor
                    }}
                  >
                    Play Again
                  </button>
                  <button
                    onClick={handleBackToGames}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
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
          )}
        </div>
      </div>
    );
  }

  // Main Game Selection Screen
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
      {/* Header with Navigation */}
      <div 
        className="h-16 border-b flex items-center justify-between px-6 text-white"
        style={{ 
          background: customization.gradientEnabled 
            ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
            : customization.primaryColor,
          borderBottomColor: isDark ? '#374151' : customization.primaryColor + '40'
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToChat}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            style={{ fontFamily: customization.fontFamily }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Chat
          </button>
          <h1 className="text-xl font-semibold" style={{ fontFamily: customization.fontFamily }}>
            Gaming Hub
          </h1>
        </div>
        
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg transition-colors bg-white/10 hover:bg-white/20 text-white"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-6xl w-full">
          {/* Welcome Section */}
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
              Choose Your Game Mode
            </h2>
            <p 
              className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              style={{ fontFamily: customization.fontFamily }}
            >
              Challenge yourself with AI-powered games and quizzes
            </p>
          </div>

          {/* Game Mode Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Gameshow Panel */}
            <div 
              className={`group cursor-pointer rounded-2xl p-8 border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                  : 'bg-white border-gray-200 hover:border-purple-300'
              }`}
              onClick={handleGameshowClick}
              style={{
                borderColor: isDark ? undefined : customization.primaryColor + '20'
              }}
              onMouseEnter={(e) => {
                if (!isDark) {
                  e.currentTarget.style.borderColor = customization.primaryColor + '60';
                  e.currentTarget.style.background = customization.gradientEnabled
                    ? `linear-gradient(135deg, ${customization.primaryColor}10, ${customization.secondaryColor}05)`
                    : customization.primaryColor + '10';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDark) {
                  e.currentTarget.style.borderColor = customization.primaryColor + '20';
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              {/* Gameshow Icon */}
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6 text-white"
                style={{ 
                  background: customization.gradientEnabled 
                    ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                    : customization.primaryColor
                }}
              >
                <Trophy className="w-8 h-8" />
              </div>

              {/* Gameshow Content */}
              <h3 
                className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
                style={{ 
                  fontFamily: customization.fontFamily,
                  color: isDark ? undefined : customization.primaryColor
                }}
              >
                Family Feud Style
              </h3>
              
              <p 
                className={`text-base mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                style={{ fontFamily: customization.fontFamily }}
              >
                Compete against AI in a Family Feud style game! Guess the most popular survey answers 
                and try to beat the AI's score. Can you think like the crowd?
              </p>

              {/* Gameshow Features */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Users className={`w-5 h-5 ${isDark ? 'text-gray-400' : ''}`} 
                        style={{ color: isDark ? undefined : customization.primaryColor }} />
                  <span 
                    className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    style={{ fontFamily: customization.fontFamily }}
                  >
                    You vs AI Competition
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className={`w-5 h-5 ${isDark ? 'text-gray-400' : ''}`} 
                       style={{ color: isDark ? undefined : customization.primaryColor }} />
                  <span 
                    className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    style={{ fontFamily: customization.fontFamily }}
                  >
                    Real Survey Questions
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Trophy className={`w-5 h-5 ${isDark ? 'text-gray-400' : ''}`} 
                         style={{ color: isDark ? undefined : customization.primaryColor }} />
                  <span 
                    className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    style={{ fontFamily: customization.fontFamily }}
                  >
                    Points & Scoring System
                  </span>
                </div>
              </div>

              {/* Play Button */}
              <button 
                className="w-full mt-6 py-3 px-6 rounded-lg font-semibold text-white transition-colors hover:opacity-90"
                style={{ 
                  background: customization.gradientEnabled 
                    ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                    : customization.primaryColor,
                  fontFamily: customization.fontFamily
                }}
              >
                Start Gameshow
              </button>
            </div>

            {/* Quiz Panel */}
            <div 
              className={`group cursor-pointer rounded-2xl p-8 border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                  : 'bg-white border-gray-200 hover:border-purple-300'
              }`}
              onClick={handleQuizClick}
              style={{
                borderColor: isDark ? undefined : customization.secondaryColor + '20'
              }}
              onMouseEnter={(e) => {
                if (!isDark) {
                  e.currentTarget.style.borderColor = customization.secondaryColor + '60';
                  e.currentTarget.style.background = customization.gradientEnabled
                    ? `linear-gradient(135deg, ${customization.secondaryColor}10, ${customization.primaryColor}05)`
                    : customization.secondaryColor + '10';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDark) {
                  e.currentTarget.style.borderColor = customization.secondaryColor + '20';
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              {/* Quiz Icon */}
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6 text-white"
                style={{ 
                  background: customization.gradientEnabled 
                    ? `linear-gradient(135deg, ${customization.secondaryColor}, ${customization.primaryColor})`
                    : customization.secondaryColor
                }}
              >
                <Brain className="w-8 h-8" />
              </div>

              {/* Quiz Content */}
              <h3 
                className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
                style={{ 
                  fontFamily: customization.fontFamily,
                  color: isDark ? undefined : customization.secondaryColor
                }}
              >
                Knowledge Quiz
              </h3>
              
              <p 
                className={`text-base mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                style={{ fontFamily: customization.fontFamily }}
              >
                Test your knowledge against AI in rapid-fire questions! Geography, science, history, and more. 
                Race against time and see who's smarter!
              </p>

              {/* Quiz Features */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Brain className={`w-5 h-5 ${isDark ? 'text-gray-400' : ''}`} 
                        style={{ color: isDark ? undefined : customization.secondaryColor }} />
                  <span 
                    className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    style={{ fontFamily: customization.fontFamily }}
                  >
                    Multiple Choice Questions
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className={`w-5 h-5 ${isDark ? 'text-gray-400' : ''}`} 
                       style={{ color: isDark ? undefined : customization.secondaryColor }} />
                  <span 
                    className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    style={{ fontFamily: customization.fontFamily }}
                  >
                    15 Second Time Limit
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Target className={`w-5 h-5 ${isDark ? 'text-gray-400' : ''}`} 
                         style={{ color: isDark ? undefined : customization.secondaryColor }} />
                  <span 
                    className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    style={{ fontFamily: customization.fontFamily }}
                  >
                    Score & Performance Tracking
                  </span>
                </div>
              </div>

              {/* Play Button */}
              <button 
                className="w-full mt-6 py-3 px-6 rounded-lg font-semibold text-white transition-colors hover:opacity-90"
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

          {/* Additional Info */}
          <div className="text-center mt-12">
            <p 
              className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              style={{ fontFamily: customization.fontFamily }}
            >
              More game modes coming soon! Stay tuned for exciting updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}