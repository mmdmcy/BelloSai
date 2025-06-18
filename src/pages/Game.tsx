import React, { useState, useEffect } from 'react';
import { sendChatMessage, ChatMessage } from '../lib/supabase-chat';
import { ArrowLeft } from 'lucide-react';

interface GameProps {
  isDark: boolean;
  customization: any;
  onToggleTheme: () => void;
  onBackToHome?: () => void;
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

function GameComponent({ isDark, customization, onToggleTheme, onBackToHome }: GameProps) {
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
  const [rateLimitMode, setRateLimitMode] = useState(false);

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
    setRateLimitMode(false);
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
      // Fallback questions - larger variety to prevent repetition
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
          question: "We asked 100 people: Name something people always forget to pack when traveling",
          answers: [
            { text: "Phone charger", points: 32 },
            { text: "Toothbrush", points: 28 },
            { text: "Underwear", points: 18 },
            { text: "Medications", points: 12 },
            { text: "Passport", points: 10 }
          ]
        },
        {
          question: "We asked 100 people: Name something people do while stuck in traffic",
          answers: [
            { text: "Listen to music", points: 30 },
            { text: "Check their phone", points: 25 },
            { text: "Sing along to radio", points: 20 },
            { text: "People watch", points: 15 },
            { text: "Plan their day", points: 10 }
          ]
        },
        {
          question: "We asked 100 people: Name something you see at every birthday party",
          answers: [
            { text: "Birthday cake", points: 40 },
            { text: "Balloons", points: 25 },
            { text: "Presents", points: 20 },
            { text: "Candles", points: 10 },
            { text: "Party hats", points: 5 }
          ]
        },
        {
          question: "We asked 100 people: Name something people do to avoid small talk",
          answers: [
            { text: "Look at their phone", points: 35 },
            { text: "Pretend to be busy", points: 25 },
            { text: "Wear headphones", points: 18 },
            { text: "Avoid eye contact", points: 12 },
            { text: "Take a different route", points: 10 }
          ]
        },
        {
          question: "We asked 100 people: Name something people buy but never use",
          answers: [
            { text: "Exercise equipment", points: 30 },
            { text: "Books", points: 25 },
            { text: "Kitchen gadgets", points: 20 },
            { text: "Gym membership", points: 15 },
            { text: "Apps", points: 10 }
          ]
        },
        {
          question: "We asked 100 people: Name something people do when they can't sleep",
          answers: [
            { text: "Scroll on phone", points: 30 },
            { text: "Watch TV", points: 25 },
            { text: "Read a book", points: 20 },
            { text: "Count sheep", points: 15 },
            { text: "Get a snack", points: 10 }
          ]
        },
        {
          question: "We asked 100 people: Name something people always say they'll do tomorrow",
          answers: [
            { text: "Start dieting", points: 30 },
            { text: "Exercise", points: 25 },
            { text: "Clean the house", points: 20 },
            { text: "Call someone back", points: 15 },
            { text: "Start studying", points: 10 }
          ]
        },
        {
          question: "We asked 100 people: Name something people hoard but shouldn't",
          answers: [
            { text: "Old clothes", points: 30 },
            { text: "Plastic bags", points: 25 },
            { text: "Old magazines", points: 20 },
            { text: "Cables and chargers", points: 15 },
            { text: "Receipts", points: 10 }
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
        
        // Always switch to AI turn after player guess (correct or wrong)
        setTurn('ai');
        
        // AI turn after longer delay to prevent rate limits
        setTimeout(() => {
          if (!gameEnded) {
            handleAITurn();
          }
        }, 5000);
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
      
              // AI turn after longer delay to prevent rate limits
        setTimeout(() => {
          if (!gameEnded) {
            handleAITurn();
          }
        }, 5000);
    }
  };

  const handleAITurn = async () => {
    if (!question || gameEnded) return;

    setAiThinking(true);

    // If we're in rate limit mode, use simple offline AI
    if (rateLimitMode) {
      console.log('Using offline AI mode due to rate limits...');
      
      const availableAnswers = question.answers
        .map((answer, index) => ({ answer, index }))
        .filter(({ index }) => !revealedAnswers.includes(index));
      
      if (availableAnswers.length > 0) {
        // Simple AI: pick a random answer (they're all correct)
        const randomChoice = availableAnswers[Math.floor(Math.random() * availableAnswers.length)];
        const guess = randomChoice.answer.text;
        
        setLastAiGuess({
          text: guess,
          correct: true,
          points: randomChoice.answer.points,
          matchedAnswer: guess
        });
        
        const newRevealed = [...revealedAnswers, randomChoice.index];
        setRevealedAnswers(newRevealed);
        setAiScore(prev => prev + randomChoice.answer.points);
        setGameLog(prev => [...prev, `AI (offline): "${guess}" → ✅ (${randomChoice.answer.points} pts)`]);
        
        if (newRevealed.length === question.answers.length) {
          setGameEnded(true);
          setGameStatus('finished');
        } else {
          setTurn('player');
        }
      } else {
        setTurn('player');
      }
      
      setAiThinking(false);
      return;
    }

    try {
      const availableAnswers = question.answers
        .map((answer, index) => ({ answer, index }))
        .filter(({ index }) => !revealedAnswers.includes(index));
      
      if (availableAnswers.length === 0) {
        setAiThinking(false);
        return;
      }
      
              // Build context for AI - include both revealed answers AND all previous AI guesses
        const revealedAnswerTexts = revealedAnswers.map(i => question.answers[i].text);
        const allPreviousGuesses = [...revealedAnswerTexts, ...aiPreviousGuesses];
        const previousGuessText = allPreviousGuesses.length > 0 ? 
          `\n\nALREADY GUESSED (do NOT repeat): ${allPreviousGuesses.join(', ')}` : '';
        
        const prompt = `You are playing Family Feud. The question is: "${question.question}"

Correctly guessed answers (on the board): ${revealedAnswerTexts.length > 0 ? revealedAnswerTexts.join(', ') : 'None'}${previousGuessText}

Think of a COMPLETELY NEW answer that has NOT been guessed yet. Give a short, common response people would typically give.

Reply with ONLY your answer. No explanations.`;

      console.log('Sending AI prompt:', prompt);
      
      let response;
      let retries = 0;
      const maxRetries = 2;
      
              while (retries <= maxRetries) {
          try {
            // Use shorter timeout and add delay between requests to prevent rate limits
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('AI timeout')), 8000);
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
            
            // Longer delay between retries to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      
      console.log('AI Response:', response);
      
      if (!response) {
        throw new Error('No response received from AI');
      }
      
      // Clean up the response
      const guess = response.trim().replace(/^["']|["']$/g, '');
      
      // Add to AI's previous guesses to prevent repeats (only add if not already in the list)
      setAiPreviousGuesses(prev => {
        const guessLower = guess.toLowerCase();
        if (!prev.some(prevGuess => prevGuess.toLowerCase() === guessLower)) {
          return [...prev, guess];
        }
        return prev;
      });

              // Check if AI guessed correctly (exclude already revealed answers)
        const matchResult = checkAnswerMatch(guess, question.answers, revealedAnswers);
        
        // Additional check: if the guess exactly matches an already revealed answer, it's not valid
        const alreadyRevealed = revealedAnswers.some(index => {
          const revealedAnswer = question.answers[index].text.toLowerCase();
          return revealedAnswer === guess.toLowerCase();
        });
        
        if (alreadyRevealed) {
          console.log(`AI tried to guess already revealed answer: "${guess}"`);
          // Treat as wrong guess
          const newStrikes = aiStrikes + 1;
          setAiStrikes(newStrikes);
          setLastAiGuess({
            text: guess,
            correct: false
          });
          setGameLog(prev => [...prev, `AI: "${guess}" → ❌ Already revealed! (Strike ${newStrikes}/${maxStrikes})`]);
          
          if (newStrikes >= maxStrikes) {
            setGameEnded(true);
            setGameStatus('finished');
            setAiThinking(false);
            return;
          }
          
          setTurn('player');
          setAiThinking(false);
          return;
        }

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
          
          // Always switch to player turn after AI guess (correct or wrong) - no more back-to-back AI turns
          setTurn('player');
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
      
      // Check if it's a rate limit error
      const isRateLimit = error instanceof Error && (
        error.message.includes('rate limit') || 
        error.message.includes('429') ||
        error.message.includes('maximum aantal verzoeken')
      );
      
      if (isRateLimit) {
        // Switch to rate limit mode - use simple AI without API calls
        setRateLimitMode(true);
        console.log('Rate limit detected, switching to offline AI mode...');
        
        // Use simple fallback AI that picks random unrevealed answers
        const availableAnswers = question.answers
          .map((answer, index) => ({ answer, index }))
          .filter(({ index }) => !revealedAnswers.includes(index));
        
        if (availableAnswers.length > 0) {
          const randomChoice = availableAnswers[Math.floor(Math.random() * availableAnswers.length)];
          const guess = randomChoice.answer.text;
          
          setLastAiGuess({
            text: guess,
            correct: true,
            points: randomChoice.answer.points,
            matchedAnswer: guess
          });
          
          const newRevealed = [...revealedAnswers, randomChoice.index];
          setRevealedAnswers(newRevealed);
          setAiScore(prev => prev + randomChoice.answer.points);
          setGameLog(prev => [...prev, `AI (offline): "${guess}" → ✅ (${randomChoice.answer.points} pts)`]);
          
          if (newRevealed.length === question.answers.length) {
            setGameEnded(true);
            setGameStatus('finished');
            setAiThinking(false);
            return;
          }
        }
        
        setTurn('player');
      } else {
        // For other errors (timeout, etc.), give AI a strike
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
      {/* Header with Back Button */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
                title="Back to Home"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
            )}
            <h1 className="text-2xl font-bold">🎮 Family Feud Game</h1>
          </div>
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Toggle Theme"
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,9c1.65,0 3,1.35 3,3s-1.35,3 -3,3s-3,-1.35 -3,-3S10.35,9 12,9M12,7c-2.76,0 -5,2.24 -5,5s2.24,5 5,5s5,-2.24 5,-5S14.76,7 12,7L12,7z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.4 6.35,17.41C9.37,20.43 14,20.54 17.33,17.97Z"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        {/* Score Display */}
        <div className={`flex justify-center gap-8 mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="text-center">
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>You</div>
            <div className="text-2xl font-bold">{playerScore}</div>
            <div className="text-sm text-red-500">
              ❌ {playerStrikes}/{maxStrikes}
            </div>
          </div>
          <div className="text-center">
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>AI</div>
            <div className="text-2xl font-bold">{aiScore}</div>
            <div className="text-sm text-red-500">
              ❌ {aiStrikes}/{maxStrikes}
            </div>
          </div>
        </div>

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
                  {revealedAnswers.includes(index) ? answer.text : gameEnded ? answer.text : '???'}
                </span>
              </div>
              <span className="font-bold text-lg">
                {revealedAnswers.includes(index) ? answer.points : gameEnded ? answer.points : '??'}
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

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <GameComponent
      isDark={isDark}
      customization={customization}
      onToggleTheme={() => setIsDark(!isDark)}
      onBackToHome={handleBackToHome}
    />
  );
} 