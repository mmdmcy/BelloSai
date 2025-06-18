/**
 * GameSection Component
 * 
 * This component renders the gaming section of the application with two main panels:
 * - Gameshow: Interactive AI-powered game show experience (AI Feud style)
 * - Quiz: Fun quiz games with various topics
 * 
 * Features:
 * - Two distinct gaming modes with actual gameplay
 * - Responsive card-based layout
 * - Theme-aware styling
 * - Navigation back to main chat
 * - Attractive hover effects and animations
 * - AI-powered AI Feud with DeepSeek-V3 and DeepSeek-R1
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Brain, Users, Zap, Sun, Moon, Play, Clock, Target, CheckCircle, XCircle, Star, Loader2 } from 'lucide-react';
import { CustomizationSettings } from '../App';
import { 
  generateAIFeudQuestion, 
  getAIGuess, 
  checkPlayerGuess,
  AIFeudQuestion,
  AIGuessResult 
} from '../lib/ai-feud';

interface GameSectionProps {
  isDark: boolean;
  customization: CustomizationSettings;
  onBackToChat: () => void;
  onToggleTheme: () => void;
}

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
    gamePhase: 'playing' as 'playing' | 'finished' | 'loading',
    playerGuess: '',
    lastGuessResult: null as 'correct' | 'incorrect' | null,
    round: 1,
    question: null as AIFeudQuestion | null,
    aiThinking: false,
    aiGuess: '',
    aiGuessResult: null as AIGuessResult | null,
    turn: 'player' as 'player' | 'ai',
    lastPlayerGuess: ''
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
   * Generates a new AI-powered AI Feud question
   */
  const handleGameshowClick = async () => {
    setSelectedGame('gameshow');
    
    // Set loading state
    setGameshowState(prev => ({
      ...prev,
      gamePhase: 'loading',
      currentQuestion: 0,
      playerScore: 0,
      aiScore: 0,
      revealedAnswers: [],
      strikes: 0,
      playerGuess: '',
      lastGuessResult: null,
      round: 1,
      question: null,
      aiThinking: false,
      aiGuess: '',
      aiGuessResult: null,
      turn: 'player',
      lastPlayerGuess: ''
    }));

    try {
      // Generate new question using AI
      const question = await generateAIFeudQuestion();
      
      setGameshowState(prev => ({
        ...prev,
        question,
        gamePhase: 'playing'
      }));
    } catch (error) {
      console.error('Failed to generate question:', error);
      // Use fallback question
      setGameshowState(prev => ({
        ...prev,
        question: {
          question: "Name something people do when they can't sleep",
          answers: [
            { text: "Read a book", points: 32, keywords: ["read", "book", "reading"] },
            { text: "Watch TV", points: 28, keywords: ["watch", "tv", "television"] },
            { text: "Count sheep", points: 18, keywords: ["count", "sheep", "counting"] },
            { text: "Listen to music", points: 12, keywords: ["listen", "music", "audio"] },
            { text: "Get a snack", points: 10, keywords: ["snack", "eat", "food"] }
          ]
        },
        gamePhase: 'playing'
      }));
    }
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
  const handleGameshowGuess = async () => {
    if (!gameshowState.playerGuess.trim() || !gameshowState.question || gameshowState.turn !== 'player') return;
    const guess = gameshowState.playerGuess.trim();
    
    // Check of het antwoord al geraden is
    const alreadyGuessed = gameshowState.revealedAnswers.some(idx => gameshowState.question!.answers[idx].text.toLowerCase() === guess.toLowerCase());
    if (alreadyGuessed) {
      setGameshowState(prev => ({
        ...prev,
        lastGuessResult: 'incorrect',
        playerGuess: '',
        turn: 'ai', // Beurt naar AI bij al geraden antwoord
        lastPlayerGuess: guess
      }));
      // Start AI turn after a short delay
      setTimeout(() => {
        handleAIGuess();
      }, 1500);
      return;
    }
    
    // Check of het antwoord klopt
    const result = checkPlayerGuess(
      guess,
      gameshowState.question.answers,
      gameshowState.revealedAnswers.map(index => gameshowState.question!.answers[index])
    );
    
    if (result.isCorrect && result.matchedAnswer) {
      setGameshowState(prev => ({
        ...prev,
        revealedAnswers: [...prev.revealedAnswers, result.matchedAnswer!.index],
        playerScore: prev.playerScore + result.matchedAnswer!.points,
        lastGuessResult: 'correct',
        playerGuess: '',
        lastPlayerGuess: guess,
        turn: 'ai' // Beurt naar AI na correct antwoord
      }));
      
      // Start AI turn after a short delay
      setTimeout(() => {
        handleAIGuess();
      }, 1500);
    } else {
      // Fout: beurt naar AI
      setGameshowState(prev => ({
        ...prev,
        strikes: prev.strikes + 1,
        lastGuessResult: 'incorrect',
        playerGuess: '',
        turn: 'ai',
        lastPlayerGuess: guess
      }));
      
      // Check of game over (3 strikes)
      if (gameshowState.strikes >= 2) {
        setTimeout(() => {
          setGameshowState(prev => ({ ...prev, gamePhase: 'finished' }));
        }, 1000);
      } else {
        // Start AI turn after a short delay
        setTimeout(() => {
          handleAIGuess();
        }, 1500);
      }
    }
  };

  /**
   * Handle AI making a guess using DeepSeek-R1
   */
  const handleAIGuess = async () => {
    if (!gameshowState.question || gameshowState.turn !== 'ai') return;
    
    setGameshowState(prev => ({ ...prev, aiThinking: true, aiGuess: '', aiGuessResult: null }));
    
    try {
      // AI mag niet raden wat al geraden is, inclusief laatste spelerantwoord
      const revealedAnswers = gameshowState.revealedAnswers.map(index => gameshowState.question!.answers[index]);
      const forbidden = [
        ...revealedAnswers.map(a => a.text.toLowerCase()),
        gameshowState.lastPlayerGuess.toLowerCase()
      ];
      const allAnswers = gameshowState.question.answers;
      const unrevealedAnswers = allAnswers.filter(a => !forbidden.includes(a.text.toLowerCase()));
      
      console.log('🤖 AI Turn Debug Info:');
      console.log('  - Question:', gameshowState.question.question);
      console.log('  - Revealed answers:', revealedAnswers.map(a => a.text));
      console.log('  - Forbidden answers:', forbidden);
      console.log('  - Available answers:', unrevealedAnswers.map(a => a.text));
      console.log('  - Last player guess:', gameshowState.lastPlayerGuess);
      
      // Check if there are any answers left to guess
      if (unrevealedAnswers.length === 0) {
        console.log('❌ No answers left to guess');
        setGameshowState(prev => ({ 
          ...prev, 
          aiThinking: false, 
          turn: 'player',
          aiGuess: 'No more answers to guess',
          aiGuessResult: { guess: 'No more answers', confidence: 0, isCorrect: false }
        }));
        return;
      }
      
      console.log('🚀 Calling AI with options:', unrevealedAnswers.map(a => a.text));
      
      // Get AI guess
      const result = await getAIGuess(
        gameshowState.question.question,
        revealedAnswers,
        unrevealedAnswers
      );
      
      console.log('✅ AI Response:', result);
      
      setGameshowState(prev => ({ 
        ...prev, 
        aiGuess: result.guess,
        aiGuessResult: result,
        aiThinking: false 
      }));
      
      // Process the result
      setTimeout(() => {
        if (result.isCorrect && result.matchedAnswer) {
          console.log('🎯 AI guessed correctly:', result.matchedAnswer.text);
          setGameshowState(prev => ({
            ...prev,
            revealedAnswers: [...prev.revealedAnswers, result.matchedAnswer!.index],
            aiScore: prev.aiScore + result.matchedAnswer!.points,
            turn: 'ai', // AI mag doorgaan bij goed antwoord
          }));
          
          // AI gets another turn if correct
          setTimeout(() => {
            handleAIGuess();
          }, 1500);
        } else {
          console.log('❌ AI guessed incorrectly:', result.guess);
          setGameshowState(prev => ({
            ...prev,
            turn: 'player', // Beurt terug naar speler bij fout
          }));
        }
        
        // Check of alles geraden is
        setTimeout(() => {
          const currentRevealedCount = gameshowState.revealedAnswers.length + (result.isCorrect ? 1 : 0);
          if (currentRevealedCount >= 4) {
            setGameshowState(prev => ({ ...prev, gamePhase: 'finished' }));
          }
        }, 1500);
      }, 1500);
    } catch (error) {
      console.error('❌ AI guess failed with error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        question: gameshowState.question?.question,
        revealedAnswers: gameshowState.revealedAnswers,
        lastPlayerGuess: gameshowState.lastPlayerGuess
      });
      
      // Show detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setGameshowState(prev => ({ 
        ...prev, 
        aiThinking: false, 
        turn: 'player',
        aiGuess: `AI Error: ${errorMessage}`,
        aiGuessResult: { 
          guess: `Error: ${errorMessage}`, 
          confidence: 0, 
          isCorrect: false 
        }
      }));
    }
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

      // AI-Powered AI Feud Interface
  if (selectedGame === 'gameshow') {
    const currentQ = gameshowState.question;
    
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
            <h1 className="text-xl font-semibold">AI Feud</h1>
          </div>
          
          <button onClick={onToggleTheme} className="p-2 rounded-lg transition-colors bg-white/10 hover:bg-white/20 text-white">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Game Content */}
        <div className="flex-1 p-8">
          {gameshowState.gamePhase === 'loading' ? (
            <div className="flex items-center justify-center h-full">
              <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
                <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-500" />
                <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Generating Question...
                </h2>
                <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  DeepSeek-V3 is creating a fun AI Feud question for you!
                </p>
              </div>
            </div>
          ) : gameshowState.gamePhase === 'playing' && currentQ ? (
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
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-red-200' : 'text-red-800'}`}>AI (DeepSeek-R1)</h3>
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

              {/* Turn Indicator */}
              <div className={`p-4 rounded-xl mb-6 text-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <div className="flex items-center justify-center gap-3">
                  {gameshowState.turn === 'player' ? (
                    <>
                      <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className={`text-lg font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        Jouw beurt!
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                      <span className={`text-lg font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                        AI's beurt!
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* AI Thinking Indicator */}
              {gameshowState.aiThinking && (
                <div className={`p-4 rounded-xl mb-6 text-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                    <span className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      DeepSeek-R1 is thinking...
                    </span>
                  </div>
                </div>
              )}

              {/* AI Guess Display */}
              {gameshowState.aiGuess && gameshowState.aiGuessResult && (
                <div className={`p-4 rounded-xl mb-6 text-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                  <div className="flex items-center justify-center gap-3">
                    <span className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      AI guessed:
                    </span>
                    <span className={`text-xl font-bold ${
                      gameshowState.aiGuessResult.isCorrect 
                        ? isDark ? 'text-green-400' : 'text-green-600'
                        : isDark ? 'text-red-400' : 'text-red-600'
                    }`}>
                      "{gameshowState.aiGuess}"
                    </span>
                    {gameshowState.aiGuessResult.isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                </div>
              )}

              {/* Input Section - Alleen bij spelerbeurt */}
              {gameshowState.turn === 'player' && !gameshowState.aiThinking && (
                <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                  <div className="max-w-2xl mx-auto">
                    <h3 className={`text-lg font-semibold mb-4 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Jouw beurt! Raad een antwoord:
                    </h3>
                    {gameshowState.lastGuessResult && (
                      <div className={`mb-4 p-3 rounded-lg text-center ${
                        gameshowState.lastGuessResult === 'correct'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {gameshowState.lastGuessResult === 'correct' ? '✅ Goed geraden!' : '❌ Niet op het bord!'}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={gameshowState.playerGuess}
                        onChange={(e) => setGameshowState(prev => ({ ...prev, playerGuess: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleGameshowGuess()}
                        placeholder="Typ je antwoord..."
                        className={`flex-1 p-3 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:outline-none focus:ring-2`}
                        style={{ '--tw-ring-color': customization.primaryColor } as React.CSSProperties}
                        disabled={gameshowState.aiThinking}
                      />
                      <button
                        onClick={handleGameshowGuess}
                        disabled={!gameshowState.playerGuess.trim() || gameshowState.aiThinking}
                        className="px-6 py-3 rounded-lg font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                        style={{ 
                          background: customization.gradientEnabled 
                            ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                            : customization.primaryColor
                        }}
                      >
                        Raad
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Turn Indicator - Show when it's AI's turn and not thinking */}
              {gameshowState.turn === 'ai' && !gameshowState.aiThinking && !gameshowState.aiGuess && (
                <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                  <div className="max-w-2xl mx-auto text-center">
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      AI's Turn! DeepSeek-R1 is preparing to guess...
                    </h3>
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                      <span className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Getting ready to make a guess...
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
                <div className="grid grid-cols-1 gap-3">
                  {currentQ.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => !quizState.showResult && handleQuizAnswer(index)}
                      disabled={quizState.showResult}
                      className={`p-4 rounded-lg text-left transition-all ${
                        quizState.selectedAnswer === index
                          ? isDark ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'
                          : isDark 
                            ? 'bg-gray-700 text-white hover:bg-gray-600' 
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      } ${quizState.showResult ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          quizState.selectedAnswer === index
                            ? 'bg-white text-purple-600'
                            : isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="text-lg">{option}</span>
                      </div>
                      
                      {/* Show result indicators */}
                      {quizState.showResult && (
                        <div className="flex items-center gap-2 mt-2">
                          {index === currentQ.correct ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : quizState.selectedAnswer === index ? (
                            <XCircle className="w-5 h-5 text-red-500" />
                          ) : null}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Quiz Game Over Screen
            <div className="flex items-center justify-center h-full">
              <div className={`p-8 rounded-2xl text-center max-w-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
                <Trophy className="w-16 h-16 mx-auto mb-6 text-yellow-500" />
                <h2 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Quiz Complete!
                </h2>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <div className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>You</div>
                    <div className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{quizState.playerScore}</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>AI</div>
                    <div className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{quizState.aiScore}</div>
                  </div>
                </div>
                
                <div className={`text-xl mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {quizState.playerScore > quizState.aiScore ? '🎉 You Won!' : 
                   quizState.playerScore < quizState.aiScore ? '🤖 AI Wins!' : '🤝 It\'s a Tie!'}
                </div>
                
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleQuizClick}
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
            onClick={onBackToChat}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Chat
          </button>
          <h1 className="text-xl font-semibold">Game Center</h1>
        </div>
        
        <button onClick={onToggleTheme} className="p-2 rounded-lg transition-colors bg-white/10 hover:bg-white/20 text-white">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Game Selection */}
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Choose Your Game
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Challenge yourself against AI in these exciting games!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* AI Feud Card */}
            <div 
              className={`p-8 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer ${
                isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
              }`}
              onClick={handleGameshowClick}
            >
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  isDark ? 'bg-purple-600' : 'bg-purple-100'
                }`}>
                  <Users className={`w-8 h-8 ${isDark ? 'text-white' : 'text-purple-600'}`} />
                </div>
                <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  AI Feud
                </h3>
                <p className={`text-lg mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Play the classic survey game against DeepSeek-R1! 
                  DeepSeek-V3 generates unique questions and answers.
                </p>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className={`flex items-center gap-2 ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
                    <Brain className="w-4 h-4" />
                    <span>AI Generated</span>
                  </div>
                  <div className={`flex items-center gap-2 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                    <Zap className="w-4 h-4" />
                    <span>Real-time</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quiz Card */}
            <div 
              className={`p-8 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer ${
                isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
              }`}
              onClick={handleQuizClick}
            >
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  isDark ? 'bg-green-600' : 'bg-green-100'
                }`}>
                  <Target className={`w-8 h-8 ${isDark ? 'text-white' : 'text-green-600'}`} />
                </div>
                <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Quiz Challenge
                </h3>
                <p className={`text-lg mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Test your knowledge across various topics! 
                  Race against time and compete with AI.
                </p>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className={`flex items-center gap-2 ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                    <Clock className="w-4 h-4" />
                    <span>Timed</span>
                  </div>
                  <div className={`flex items-center gap-2 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                    <Star className="w-4 h-4" />
                    <span>Multiple Topics</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}