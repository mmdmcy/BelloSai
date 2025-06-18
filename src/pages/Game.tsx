import React, { useState, useEffect } from 'react';
import { sendChatMessage, ChatMessage } from '../lib/supabase-chat';

interface GameProps {
  isDark: boolean;
  customization: any;
  onToggleTheme: () => void;
}

interface FamilyFeudQuestion {
  question: string;
  answers: Array<{
    text: string;
    points: number;
  }>;
}

interface GuessResult {
  text: string;
  correct: boolean;
  points?: number;
  matchedAnswer?: string;
}

function GameComponent({ isDark, customization, onToggleTheme }: GameProps) {
  const [question, setQuestion] = useState<FamilyFeudQuestion | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [playerGuess, setPlayerGuess] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [gameStatus, setGameStatus] = useState('loading'); // loading, playing, finished
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [lastPlayerGuess, setLastPlayerGuess] = useState<GuessResult | null>(null);
  const [lastAiGuess, setLastAiGuess] = useState<GuessResult | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [playerStrikes, setPlayerStrikes] = useState(0);
  const [aiStrikes, setAiStrikes] = useState(0);
  const [maxStrikes] = useState(3);
  const [aiPreviousGuesses, setAiPreviousGuesses] = useState<string[]>([]);
  const [gameLog, setGameLog] = useState<string[]>([]);

  // Generate question on load
  useEffect(() => {
    generateQuestion();
  }, []);

  // Check if game is over
  useEffect(() => {
    if (question && (revealedAnswers.length === question.answers.length || playerStrikes >= maxStrikes || aiStrikes >= maxStrikes)) {
      setGameEnded(true);
      setGameStatus('finished');
    }
  }, [revealedAnswers, question, playerStrikes, aiStrikes, maxStrikes]);

  // Clear last guesses after 4 seconds
  useEffect(() => {
    if (lastPlayerGuess) {
      const timer = setTimeout(() => {
        setLastPlayerGuess(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [lastPlayerGuess]);

  useEffect(() => {
    if (lastAiGuess) {
      const timer = setTimeout(() => {
        setLastAiGuess(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [lastAiGuess]);

  const generateQuestion = async () => {
    setGameStatus('loading');
    setRevealedAnswers([]);
    setPlayerScore(0);
    setAiScore(0);
    setPlayerGuess('');
    setLastPlayerGuess(null);
    setLastAiGuess(null);
    setGameEnded(false);
    setPlayerStrikes(0);
    setAiStrikes(0);
    setAiPreviousGuesses([]);
    setGameLog([]);
    setTurn('player');
    
    try {
      const prompts = [
        `Generate a Family Feud question about daily morning routines. Format:
Question: We asked 100 people: [question]
Answers:
1. [answer] - [points]
2. [answer] - [points]
3. [answer] - [points]
4. [answer] - [points]
5. [answer] - [points]

Make it fun and modern. No markdown formatting.`,
        `Generate a Family Feud question about workplace habits. Format:
Question: We asked 100 people: [question]
Answers:
1. [answer] - [points]
2. [answer] - [points]
3. [answer] - [points]
4. [answer] - [points]
5. [answer] - [points]

Make it fun and modern. No markdown formatting.`,
        `Generate a Family Feud question about food and eating habits. Format:
Question: We asked 100 people: [question]
Answers:
1. [answer] - [points]
2. [answer] - [points]
3. [answer] - [points]
4. [answer] - [points]
5. [answer] - [points]

Make it fun and modern. No markdown formatting.`,
        `Generate a Family Feud question about technology and social media. Format:
Question: We asked 100 people: [question]
Answers:
1. [answer] - [points]
2. [answer] - [points]
3. [answer] - [points]
4. [answer] - [points]
5. [answer] - [points]

Make it fun and modern. No markdown formatting.`,
        `Generate a Family Feud question about daily routines and habits. Format:
Question: We asked 100 people: [question]
Answers:
1. [answer] - [points]
2. [answer] - [points]
3. [answer] - [points]
4. [answer] - [points]
5. [answer] - [points]

Make it fun and modern. No markdown formatting.`
      ];

      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      const response = await sendChatMessage([{ type: 'user', content: randomPrompt }], 'DeepSeek-V3');
      console.log('AI Response:', response);
      
      const parsed = parseQuestion(response);
      setQuestion(parsed);
      setGameStatus('playing');
      setTurn('player');
    } catch (error) {
      console.error('Failed to generate question:', error);
      // Fallback questions
      const fallbackQuestions = [
        {
          question: "We asked 100 people: What's the first thing you do when you wake up in the morning?",
          answers: [
            { text: "Check your phone", points: 35 },
            { text: "Hit the snooze button", points: 25 },
            { text: "Brush your teeth", points: 18 },
            { text: "Drink coffee", points: 15 },
            { text: "Stretch or yawn", points: 7 }
          ]
        },
        {
          question: "We asked 100 people: Name something people do when they're bored at work",
          answers: [
            { text: "Scroll social media", points: 35 },
            { text: "Chat with coworkers", points: 25 },
            { text: "Take coffee breaks", points: 20 },
            { text: "Organize desk", points: 12 },
            { text: "Plan vacation", points: 8 }
          ]
        },
        {
          question: "We asked 100 people: Name something people do when they're stressed",
          answers: [
            { text: "Exercise", points: 30 },
            { text: "Eat comfort food", points: 25 },
            { text: "Listen to music", points: 20 },
            { text: "Take deep breaths", points: 15 },
            { text: "Call a friend", points: 10 }
          ]
        }
      ];
      
      const randomFallback = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
      setQuestion(randomFallback);
      setGameStatus('playing');
    }
  };

  const parseQuestion = (response: string): FamilyFeudQuestion => {
    const lines = response.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    let question = '';
    const answers = [];

    for (const line of lines) {
      if (line.toLowerCase().includes('question:')) {
        question = line.replace(/question:\s*/i, '').trim();
      } else if (!question && line.includes('?')) {
        question = line.trim();
      } else if (line.match(/\d+\./)) {
        const match = line.match(/(\d+)\.\s*(.+?)\s*-\s*(\d+)/);
        if (match) {
          answers.push({
            text: match[2].trim(),
            points: parseInt(match[3])
          });
        }
      }
    }

    if (!question || question.length < 10) {
      question = "We asked 100 people: What's the first thing you do when you wake up in the morning?";
    }

    while (answers.length < 5) {
      answers.push({
        text: `Answer ${answers.length + 1}`,
        points: Math.max(1, 20 - answers.length * 3)
      });
    }

    return { question, answers: answers.slice(0, 5) };
  };

  // Improved answer matching function
  const checkAnswerMatch = (guess: string, answers: Array<{ text: string; points: number }>, excludeIndices: number[] = []): { answerIndex: number; matchedText: string } | null => {
    const guessLower = guess.toLowerCase().trim();
    
    for (let i = 0; i < answers.length; i++) {
      if (excludeIndices.includes(i)) continue;
      
      const answerLower = answers[i].text.toLowerCase();
      
      // Exact match
      if (guessLower === answerLower) {
        return { answerIndex: i, matchedText: answers[i].text };
      }
      
      // Simplified word matching - extract key words
      const answerWords = answerLower.split(/\s+/).filter(word => word.length > 2);
      const guessWords = guessLower.split(/\s+/).filter(word => word.length > 2);
      
      // Check if key words match (ignore common words like "the", "your", "my")
      const commonWords = ['the', 'a', 'an', 'your', 'my', 'our', 'their', 'his', 'her', 'its'];
      const meaningfulAnswerWords = answerWords.filter(word => !commonWords.includes(word));
      const meaningfulGuessWords = guessWords.filter(word => !commonWords.includes(word));
      
      // If most meaningful words match, it's a match
      const matches = meaningfulAnswerWords.filter(word => 
        meaningfulGuessWords.some(guessWord => 
          word.includes(guessWord) || guessWord.includes(word) || 
          // Handle common synonyms
          (word === 'phone' && guessWord === 'mobile') ||
          (word === 'mobile' && guessWord === 'phone') ||
          (word === 'brush' && guessWord === 'clean') ||
          (word === 'clean' && guessWord === 'brush')
        )
      );
      
      if (matches.length > 0 && matches.length >= Math.min(2, meaningfulAnswerWords.length)) {
        return { answerIndex: i, matchedText: answers[i].text };
      }
    }
    
    return null;
  };

  const handlePlayerGuess = async () => {
    if (!question || !playerGuess.trim() || gameEnded) return;

    const guess = playerGuess.trim();
    const matchResult = checkAnswerMatch(guess, question.answers, revealedAnswers);

    if (matchResult) {
      // Correct guess
      const newRevealed = [...revealedAnswers, matchResult.answerIndex];
      setRevealedAnswers(newRevealed);
      setPlayerScore(prev => prev + question.answers[matchResult.answerIndex].points);
      setLastPlayerGuess({
        text: guess,
        correct: true,
        points: question.answers[matchResult.answerIndex].points,
        matchedAnswer: matchResult.matchedText
      });
      setGameLog(prev => [...prev, `Player: "${guess}" → ✅ "${matchResult.matchedText}" (${question.answers[matchResult.answerIndex].points} pts)`]);
      setPlayerGuess('');
      
      // Check if all answers revealed
      if (newRevealed.length === question.answers.length) {
        setGameEnded(true);
        setGameStatus('finished');
        return;
      }
      
      setTurn('ai');
      
      // AI turn after delay
      setTimeout(() => {
        if (!gameEnded) {
          handleAITurn();
        }
      }, 2000);
    } else {
      // Wrong guess
      const newStrikes = playerStrikes + 1;
      setPlayerStrikes(newStrikes);
      setLastPlayerGuess({
        text: guess,
        correct: false
      });
      setGameLog(prev => [...prev, `Player: "${guess}" → ❌ (Strike ${newStrikes}/${maxStrikes})`]);
      setPlayerGuess('');
      
      // Check if game over due to strikes
      if (newStrikes >= maxStrikes) {
        setGameEnded(true);
        setGameStatus('finished');
        return;
      }
      
      setTurn('ai');
      
      // AI turn after delay
      setTimeout(() => {
        if (!gameEnded) {
          handleAITurn();
        }
      }, 2000);
    }
  };

  const handleAITurn = async () => {
    if (!question || gameEnded) return;

    setAiThinking(true);

    try {
      const availableAnswers = question.answers
        .map((answer, index) => ({ answer, index }))
        .filter(({ index }) => !revealedAnswers.includes(index));
      
      if (availableAnswers.length === 0) {
        setAiThinking(false);
        return;
      }
      
      // Build context for AI
      const revealedAnswerTexts = revealedAnswers.map(i => question.answers[i].text);
      const previousGuessText = aiPreviousGuesses.length > 0 ? 
        `\n\nDo NOT repeat these previous guesses: ${aiPreviousGuesses.join(', ')}` : '';
      
      const prompt = `You are playing Family Feud. The question is: "${question.question}"

Already revealed answers: ${revealedAnswerTexts.length > 0 ? revealedAnswerTexts.join(', ') : 'None'}${previousGuessText}

Think of a NEW answer that might be on the board. Give a short, common response people would typically give.

Reply with ONLY your answer. No explanations.`;

      console.log('Sending AI prompt:', prompt);
      
      let response;
      let retries = 0;
      const maxRetries = 2;
      
      while (retries <= maxRetries) {
        try {
          // Use shorter timeout for faster game flow
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('AI timeout')), 6000);
          });
          
          const responsePromise = sendChatMessage([{ type: 'user', content: prompt }], 'DeepSeek-V3');
          response = await Promise.race([responsePromise, timeoutPromise]);
          break;
        } catch (error) {
          retries++;
          console.log(`AI request failed, attempt ${retries}/${maxRetries + 1}:`, error);
          
          if (retries > maxRetries) {
            throw error;
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log('AI Response:', response);
      
      if (!response) {
        throw new Error('No response received from AI');
      }
      
      // Clean up the response
      const guess = response.trim().replace(/^["']|["']$/g, '');
      
      // Add to AI's previous guesses to prevent repeats
      setAiPreviousGuesses(prev => [...prev, guess]);

      // Check if AI guessed correctly
      const matchResult = checkAnswerMatch(guess, question.answers, revealedAnswers);

      if (matchResult) {
        // AI correct
        const newRevealed = [...revealedAnswers, matchResult.answerIndex];
        setRevealedAnswers(newRevealed);
        setAiScore(prev => prev + question.answers[matchResult.answerIndex].points);
        setLastAiGuess({
          text: guess,
          correct: true,
          points: question.answers[matchResult.answerIndex].points,
          matchedAnswer: matchResult.matchedText
        });
        setGameLog(prev => [...prev, `AI: "${guess}" → ✅ "${matchResult.matchedText}" (${question.answers[matchResult.answerIndex].points} pts)`]);
        
        // Check if all answers revealed
        if (newRevealed.length === question.answers.length) {
          setGameEnded(true);
          setGameStatus('finished');
          setAiThinking(false);
          return;
        }
        
        // AI gets another turn for correct answer
        setTurn('ai');
        
        setTimeout(() => {
          if (!gameEnded) {
            handleAITurn();
          }
        }, 2000);
      } else {
        // AI wrong
        const newStrikes = aiStrikes + 1;
        setAiStrikes(newStrikes);
        setLastAiGuess({
          text: guess,
          correct: false
        });
        setGameLog(prev => [...prev, `AI: "${guess}" → ❌ (Strike ${newStrikes}/${maxStrikes})`]);
        
        // Check if game over due to AI strikes
        if (newStrikes >= maxStrikes) {
          setGameEnded(true);
          setGameStatus('finished');
          setAiThinking(false);
          return;
        }
        
        setTurn('player');
      }
    } catch (error) {
      console.error('AI turn failed:', error);
      
      // Fallback: AI makes a wrong guess to keep game moving
      const newStrikes = aiStrikes + 1;
      setAiStrikes(newStrikes);
      setLastAiGuess({
        text: "AI couldn't think of an answer",
        correct: false
      });
      setGameLog(prev => [...prev, `AI: timed out → ❌ (Strike ${newStrikes}/${maxStrikes})`]);
      
      if (newStrikes >= maxStrikes) {
        setGameEnded(true);
        setGameStatus('finished');
      } else {
        setTurn('player');
      }
    } finally {
      setAiThinking(false);
    }
  };

  if (gameStatus === 'loading') {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-purple-50 text-gray-900'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p>Generating Family Feud question...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-purple-50 text-gray-900'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p>Failed to load question</p>
            <button 
              onClick={generateQuestion}
              className="mt-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-purple-50 text-gray-900'}`}>
      {/* Header */}
      <div className="bg-purple-600 text-white p-4">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">Family Feud</h1>
          <div className="flex gap-6 items-center">
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-sm opacity-80">You</div>
                <div className="text-xl font-bold">{playerScore}</div>
                <div className="text-sm text-red-200">
                  ❌ {playerStrikes}/{maxStrikes}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm opacity-80">AI</div>
                <div className="text-xl font-bold">{aiScore}</div>
                <div className="text-sm text-red-200">
                  ❌ {aiStrikes}/{maxStrikes}
                </div>
              </div>
            </div>
            <button onClick={onToggleTheme} className="px-3 py-1 bg-white/20 rounded">
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Question */}
        <div className={`text-center mb-8 p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-xl font-bold mb-6">{question.question}</h2>
          
          {/* Answer Board */}
          <div className="grid gap-3 max-w-2xl mx-auto">
            {question.answers.map((answer, index) => (
              <div 
                key={index}
                className={`flex justify-between items-center p-4 rounded-lg border-2 transition-all ${
                  revealedAnswers.includes(index)
                    ? 'bg-green-100 border-green-400 text-green-800 transform scale-105'
                    : gameEnded
                    ? 'bg-gray-100 border-gray-300 text-gray-600'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                  <span className="font-medium">
                    {revealedAnswers.includes(index) || gameEnded ? answer.text : '???'}
                  </span>
                </div>
                <span className="font-bold text-lg">
                  {revealedAnswers.includes(index) || gameEnded ? answer.points : '??'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Game End Result */}
        {gameEnded && (
          <div className={`text-center mb-6 p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border-2 border-yellow-400`}>
            <h3 className="text-2xl font-bold mb-4">🎉 Game Over! 🎉</h3>
            {playerStrikes >= maxStrikes && (
              <div className="mb-4 text-red-600 font-medium">
                Player eliminated! ({playerStrikes}/{maxStrikes} strikes)
              </div>
            )}
            {aiStrikes >= maxStrikes && (
              <div className="mb-4 text-green-600 font-medium">
                AI eliminated! ({aiStrikes}/{maxStrikes} strikes)
              </div>
            )}
            {revealedAnswers.length === question.answers.length && (
              <div className="mb-4 text-blue-600 font-medium">
                All answers found! Perfect game! 🎯
              </div>
            )}
            <div className="text-lg mb-4">
              <div className="mb-2">Final Score:</div>
              <div className="flex justify-center gap-8">
                <div className={`text-xl font-bold ${playerScore > aiScore ? 'text-green-600' : 'text-gray-600'}`}>
                  You: {playerScore}
                </div>
                <div className={`text-xl font-bold ${aiScore > playerScore ? 'text-green-600' : 'text-gray-600'}`}>
                  AI: {aiScore}
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold mb-4">
              {playerScore > aiScore ? '🏆 You Win! 🏆' : 
               aiScore > playerScore ? '🤖 AI Wins! 🤖' : 
               '🤝 It\'s a Tie! 🤝'}
            </div>
          </div>
        )}

        {/* Last Guesses Feedback */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Player's Last Guess */}
          {lastPlayerGuess && (
            <div className={`p-4 rounded-lg border-2 ${
              lastPlayerGuess.correct 
                ? 'bg-green-100 border-green-400 text-green-800' 
                : 'bg-red-100 border-red-400 text-red-800'
            }`}>
              <div className="font-bold text-sm mb-1">👤 Your Last Guess:</div>
              <p className="font-bold">
                {lastPlayerGuess.correct 
                  ? `✅ "${lastPlayerGuess.text}" = "${lastPlayerGuess.matchedAnswer}" (+${lastPlayerGuess.points} pts!)` 
                  : `❌ "${lastPlayerGuess.text}" - Not on the board`
                }
              </p>
            </div>
          )}

          {/* AI's Last Guess */}
          {lastAiGuess && (
            <div className={`p-4 rounded-lg border-2 ${
              lastAiGuess.correct 
                ? 'bg-green-100 border-green-400 text-green-800' 
                : 'bg-red-100 border-red-400 text-red-800'
            }`}>
              <div className="font-bold text-sm mb-1">🤖 AI's Last Guess:</div>
              <p className="font-bold">
                {lastAiGuess.correct 
                  ? `✅ "${lastAiGuess.text}" = "${lastAiGuess.matchedAnswer}" (+${lastAiGuess.points} pts!)` 
                  : `❌ "${lastAiGuess.text}" - Not on the board`
                }
              </p>
            </div>
          )}
        </div>

        {/* Turn Indicator */}
        {!gameEnded && (
          <div className={`text-center mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border-2 ${
            turn === 'player' ? 'border-blue-400' : 'border-red-400'
          }`}>
            {turn === 'player' ? (
              <div className="text-blue-600 font-bold text-xl">🎯 Your Turn!</div>
            ) : (
              <div className="text-red-600 font-bold text-xl">🤖 AI's Turn</div>
            )}
          </div>
        )}

        {/* AI Thinking */}
        {aiThinking && !gameEnded && (
          <div className={`text-center mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
            <p>🤖 AI is thinking...</p>
          </div>
        )}

        {/* Player Input */}
        {turn === 'player' && !aiThinking && !gameEnded && (
          <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border-2 border-blue-400`}>
            <div className="max-w-md mx-auto">
              <input
                type="text"
                value={playerGuess}
                onChange={(e) => setPlayerGuess(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePlayerGuess()}
                placeholder="Type your guess here..."
                className={`w-full p-3 rounded-lg border-2 text-lg ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:border-blue-500 focus:outline-none`}
                autoFocus
              />
              <button
                onClick={handlePlayerGuess}
                disabled={!playerGuess.trim()}
                className="w-full mt-3 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold transition-colors"
              >
                Submit Guess
              </button>
            </div>
          </div>
        )}

        {/* Game Log */}
        {gameLog.length > 0 && (
          <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className="font-bold mb-3">Game Log:</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {gameLog.slice(-8).map((log, index) => (
                <div key={index} className="text-sm font-mono">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Game Button */}
        <div className="text-center mt-8">
          <button
            onClick={generateQuestion}
            className="px-8 py-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-lg font-bold transition-colors"
          >
            🎮 New Game
          </button>
        </div>
      </div>
    </div>
  );
}

// Wrapper component that provides default props
export default function Game() {
  const [isDark, setIsDark] = useState(false);
  const [customization] = useState({
    primaryColor: '#7c3aed',
    secondaryColor: '#a855f7',
    fontFamily: 'Inter'
  });

  return (
    <GameComponent
      isDark={isDark}
      customization={customization}
      onToggleTheme={() => setIsDark(!isDark)}
    />
  );
} 