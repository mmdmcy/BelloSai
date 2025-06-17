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

function GameComponent({ isDark, customization, onToggleTheme }: GameProps) {
  const [question, setQuestion] = useState<FamilyFeudQuestion | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [playerGuess, setPlayerGuess] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [aiGuess, setAiGuess] = useState('');
  const [gameStatus, setGameStatus] = useState('loading'); // loading, playing, finished
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [lastGuess, setLastGuess] = useState<{text: string, correct: boolean, points?: number} | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState(0); // Track wrong answers
  const [maxWrongAnswers] = useState(3); // Game over after 3 wrong answers

  // Generate question on load
  useEffect(() => {
    generateQuestion();
  }, []);

  // Check if game is over
  useEffect(() => {
    if (question && (revealedAnswers.length === question.answers.length || wrongAnswers >= maxWrongAnswers)) {
      setGameEnded(true);
      setGameStatus('finished');
    }
  }, [revealedAnswers, question, wrongAnswers, maxWrongAnswers]);

  // Clear last guess after 3 seconds
  useEffect(() => {
    if (lastGuess) {
      const timer = setTimeout(() => {
        setLastGuess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastGuess]);

  const generateQuestion = async () => {
    setGameStatus('loading');
    setRevealedAnswers([]);
    setPlayerScore(0);
    setAiScore(0);
    setPlayerGuess('');
    setAiGuess('');
    setLastGuess(null);
    setGameEnded(false);
    setWrongAnswers(0); // Reset wrong answers
    setTurn('player');
    
    try {
      // Use more varied prompts for different questions
      const prompts = [
        `Generate a Family Feud question about workplace habits. Format:
Question: [question]
Answers:
1. [answer] - [points]
2. [answer] - [points]
3. [answer] - [points]
4. [answer] - [points]
5. [answer] - [points]

Make it fun and modern. No markdown formatting.`,
        `Generate a Family Feud question about food and eating habits. Format:
Question: [question]
Answers:
1. [answer] - [points]
2. [answer] - [points]
3. [answer] - [points]
4. [answer] - [points]
5. [answer] - [points]

Make it fun and modern. No markdown formatting.`,
        `Generate a Family Feud question about technology and social media. Format:
Question: [question]
Answers:
1. [answer] - [points]
2. [answer] - [points]
3. [answer] - [points]
4. [answer] - [points]
5. [answer] - [points]

Make it fun and modern. No markdown formatting.`,
        `Generate a Family Feud question about daily routines and habits. Format:
Question: [question]
Answers:
1. [answer] - [points]
2. [answer] - [points]
3. [answer] - [points]
4. [answer] - [points]
5. [answer] - [points]

Make it fun and modern. No markdown formatting.`,
        `Generate a Family Feud question about travel and vacations. Format:
Question: [question]
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
          question: "Name something people do when they're bored at work",
          answers: [
            { text: "Scroll social media", points: 35 },
            { text: "Chat with coworkers", points: 25 },
            { text: "Take coffee breaks", points: 20 },
            { text: "Organize desk", points: 12 },
            { text: "Plan vacation", points: 8 }
          ]
        },
        {
          question: "Name something people do when they're stressed",
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
      // Better question parsing - look for the actual question line
      if (line.toLowerCase().includes('question:')) {
        question = line.replace(/question:\s*/i, '').trim();
      } else if (!question && line.includes('?')) {
        // If no "Question:" prefix, take the first line with a question mark
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

    // Fallback if parsing failed
    if (!question || question.length < 10) {
      question = "Name something people do when they're bored at work";
    }

    // Ensure we have 5 answers
    while (answers.length < 5) {
      answers.push({
        text: `Answer ${answers.length + 1}`,
        points: Math.max(1, 20 - answers.length * 3)
      });
    }

    return { question, answers: answers.slice(0, 5) };
  };

  const handlePlayerGuess = async () => {
    if (!question || !playerGuess.trim()) return;

    const guess = playerGuess.trim().toLowerCase();
    const answerIndex = question.answers.findIndex(a => 
      a.text.toLowerCase() === guess && !revealedAnswers.includes(question.answers.indexOf(a))
    );

    if (answerIndex !== -1) {
      // Correct guess
      const newRevealed = [...revealedAnswers, answerIndex];
      setRevealedAnswers(newRevealed);
      setPlayerScore(prev => prev + question.answers[answerIndex].points);
      setLastGuess({
        text: playerGuess.trim(),
        correct: true,
        points: question.answers[answerIndex].points
      });
      setPlayerGuess('');
      setTurn('ai');
      
      // AI turn
      setTimeout(() => {
        handleAITurn();
      }, 1000);
    } else {
      // Wrong guess
      const newWrongAnswers = wrongAnswers + 1;
      setWrongAnswers(newWrongAnswers);
      setLastGuess({
        text: playerGuess.trim(),
        correct: false
      });
      setPlayerGuess('');
      
      // Check if game over due to wrong answers
      if (newWrongAnswers >= maxWrongAnswers) {
        setGameEnded(true);
        setGameStatus('finished');
      } else {
        setTurn('ai');
        
        // AI turn
        setTimeout(() => {
          handleAITurn();
        }, 1000);
      }
    }
  };

  const handleAITurn = async () => {
    if (!question) return;

    setAiThinking(true);
    setAiGuess('');

    try {
      const availableAnswers = question.answers.filter((_, index) => !revealedAnswers.includes(index));
      
      if (availableAnswers.length === 0) {
        setAiThinking(false);
        return;
      }
      
      // FIX: Use question.question instead of just question
      const prompt = `You are playing Family Feud. The question is: "${question.question}"

Already revealed answers: ${revealedAnswers.map(i => question.answers[i].text).join(', ') || 'None'}

Think of a good answer that might be on the board. Respond with a short, common answer that people would typically give for this question.

Reply with ONLY your answer. No explanations.`;

      console.log('Sending AI prompt:', prompt);
      
      // Try DeepSeek-V3 instead of R1 (faster)
      let response;
      let retries = 0;
      const maxRetries = 1; // Reduced retries
      
      while (retries <= maxRetries) {
        try {
          // Use DeepSeek-V3 instead of R1 for faster response
          response = await sendChatMessage([{ type: 'user', content: prompt }], 'DeepSeek-V3');
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
      
      // Clean up the response (remove quotes if present)
      const guess = response.trim().replace(/^["']|["']$/g, '');
      setAiGuess(guess);

      // Check if AI guessed correctly using fuzzy matching
      const answerIndex = question.answers.findIndex(a => {
        const answerLower = a.text.toLowerCase();
        const guessLower = guess.toLowerCase();
        
        // Exact match
        if (answerLower === guessLower) return true;
        
        // Contains match
        if (answerLower.includes(guessLower) || guessLower.includes(answerLower)) return true;
        
        // Word overlap
        const answerWords = answerLower.split(/\s+/);
        const guessWords = guessLower.split(/\s+/);
        const overlap = answerWords.filter(word => guessWords.includes(word));
        
        return overlap.length > 0 && !revealedAnswers.includes(question.answers.indexOf(a));
      });

      if (answerIndex !== -1) {
        // AI correct
        const newRevealed = [...revealedAnswers, answerIndex];
        setRevealedAnswers(newRevealed);
        setAiScore(prev => prev + question.answers[answerIndex].points);
        setTurn('ai'); // AI gets another turn
        
        setTimeout(() => {
          handleAITurn();
        }, 1000);
      } else {
        // AI wrong
        const newWrongAnswers = wrongAnswers + 1;
        setWrongAnswers(newWrongAnswers);
        
        // Check if game over due to wrong answers
        if (newWrongAnswers >= maxWrongAnswers) {
          setGameEnded(true);
          setGameStatus('finished');
        } else {
          setTurn('player');
        }
      }
    } catch (error) {
      console.error('AI turn failed:', error);
      
      // Immediate fallback: Use simple random AI
      console.log('Using immediate random AI fallback');
      const availableAnswers = question.answers.filter((_, index) => !revealedAnswers.includes(index));
      
      if (availableAnswers.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableAnswers.length);
        const randomGuess = availableAnswers[randomIndex].text;
        
        console.log('Random AI guess:', randomGuess);
        setAiGuess(`AI: ${randomGuess}`);
        
        // Random AI is always correct (it picks from available answers)
        const answerIndex = question.answers.findIndex(a => a.text === randomGuess);
        const newRevealed = [...revealedAnswers, answerIndex];
        setRevealedAnswers(newRevealed);
        setAiScore(prev => prev + question.answers[answerIndex].points);
        setTurn('ai');
        
        setTimeout(() => {
          handleAITurn();
        }, 1000);
      } else {
        setAiGuess('AI has no moves left');
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
          <div className="flex gap-4 items-center">
            <div>You: {playerScore}</div>
            <div>AI: {aiScore}</div>
            <div className="text-red-300">
              ❌ {wrongAnswers}/{maxWrongAnswers}
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
          <h2 className="text-2xl font-bold mb-6">{question.question}</h2>
          
          {/* Answer Board */}
          <div className="grid gap-3 max-w-2xl mx-auto">
            {question.answers.map((answer, index) => (
              <div 
                key={index}
                className={`flex justify-between items-center p-4 rounded-lg border-2 ${
                  revealedAnswers.includes(index)
                    ? 'bg-green-100 border-green-400 text-green-800'
                    : gameEnded
                    ? 'bg-red-100 border-red-400 text-red-800'
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                }`}
              >
                <span className="font-medium">
                  {revealedAnswers.includes(index) || gameEnded ? answer.text : '???'}
                </span>
                <span className="font-bold">
                  {revealedAnswers.includes(index) || gameEnded ? answer.points : '??'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Game End Result */}
        {gameEnded && (
          <div className={`text-center mb-6 p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className="text-xl font-bold mb-4">Game Over!</h3>
            {wrongAnswers >= maxWrongAnswers && (
              <div className="mb-4 text-red-600 font-medium">
                Too many wrong answers! ({wrongAnswers}/{maxWrongAnswers})
              </div>
            )}
            {revealedAnswers.length === question.answers.length && (
              <div className="mb-4 text-green-600 font-medium">
                All answers found! 🎉
              </div>
            )}
            <div className="text-lg mb-4">
              <div className="mb-2">Final Score:</div>
              <div className="flex justify-center gap-8">
                <div className="text-blue-600">You: {playerScore}</div>
                <div className="text-red-600">AI: {aiScore}</div>
              </div>
            </div>
            <div className="text-lg font-bold">
              {playerScore > aiScore ? '🎉 You Win! 🎉' : 
               aiScore > playerScore ? '🤖 AI Wins! 🤖' : 
               '🤝 It\'s a Tie! 🤝'}
            </div>
          </div>
        )}

        {/* Last Guess Feedback */}
        {lastGuess && !gameEnded && (
          <div className={`text-center mb-6 p-4 rounded-lg ${
            lastGuess.correct 
              ? 'bg-green-100 border-green-400 text-green-800' 
              : 'bg-red-100 border-red-400 text-red-800'
          }`}>
            <p className="font-bold">
              {lastGuess.correct 
                ? `✅ Correct! "${lastGuess.text}" - ${lastGuess.points} points!` 
                : `❌ Wrong! "${lastGuess.text}" is not on the board.`
              }
            </p>
          </div>
        )}

        {/* Turn Indicator */}
        {!gameEnded && (
          <div className={`text-center mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            {turn === 'player' ? (
              <div className="text-blue-600 font-bold">Your Turn!</div>
            ) : (
              <div className="text-red-600 font-bold">AI's Turn</div>
            )}
          </div>
        )}

        {/* AI Thinking */}
        {aiThinking && !gameEnded && (
          <div className={`text-center mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
            <p>AI is thinking...</p>
          </div>
        )}

        {/* AI Guess */}
        {aiGuess && !aiThinking && !gameEnded && (
          <div className={`text-center mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <p>AI guessed: <span className="font-bold">{aiGuess}</span></p>
          </div>
        )}

        {/* Player Input */}
        {turn === 'player' && !aiThinking && !gameEnded && (
          <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="max-w-md mx-auto">
              <input
                type="text"
                value={playerGuess}
                onChange={(e) => setPlayerGuess(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePlayerGuess()}
                placeholder="Type your guess..."
                className={`w-full p-3 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <button
                onClick={handlePlayerGuess}
                disabled={!playerGuess.trim()}
                className="w-full mt-3 p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
              >
                Submit Guess
              </button>
            </div>
          </div>
        )}

        {/* New Game Button */}
        <div className="text-center mt-8">
          <button
            onClick={generateQuestion}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            New Game
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