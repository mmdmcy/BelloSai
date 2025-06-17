/**
 * Family Feud AI Service
 * 
 * Handles AI integration for Family Feud game:
 * - DeepSeek-V3 generates questions and top 5 answers
 * - DeepSeek-R1 provides AI player responses
 * - Answer matching and scoring logic
 */

import { sendChatMessage, ChatMessage } from './supabase-chat';

export interface FamilyFeudQuestion {
  question: string;
  answers: Array<{
    text: string;
    points: number;
    keywords: string[]; // For better matching
  }>;
}

export interface AIGuessResult {
  guess: string;
  confidence: number;
  isCorrect: boolean;
  matchedAnswer?: {
    text: string;
    points: number;
    index: number;
  };
}

/**
 * Generate a Family Feud question using DeepSeek-V3
 */
export async function generateFamilyFeudQuestion(): Promise<FamilyFeudQuestion> {
  const prompt = `Generate a Family Feud style question with exactly 5 answers and their point values. 
  
The format should be:
Question: [A fun, engaging question that people would be surveyed about]
Answers:
1. [Answer 1] - [Points 1-50]
2. [Answer 2] - [Points 1-50] 
3. [Answer 3] - [Points 1-50]
4. [Answer 4] - [Points 1-50]
5. [Answer 5] - [Points 1-50]

Make sure:
- Total points add up to 100
- Answers are common, relatable responses
- Question is fun and engaging
- Points are realistic (higher for more common answers)

Example:
Question: Name something people do when they can't sleep
Answers:
1. Read a book - 32
2. Watch TV - 28
3. Count sheep - 18
4. Listen to music - 12
5. Get a snack - 10

Generate a new, creative question:`;

  const messages: ChatMessage[] = [
    { type: 'user', content: prompt }
  ];

  try {
    const response = await sendChatMessage(messages, 'DeepSeek-V3');
    
    // Parse the response to extract question and answers
    const parsed = parseAIResponse(response);
    return parsed;
  } catch (error) {
    console.error('Failed to generate Family Feud question:', error);
    // Fallback to a default question
    return {
      question: "Name something people do when they can't sleep",
      answers: [
        { text: "Read a book", points: 32, keywords: ["read", "book", "reading"] },
        { text: "Watch TV", points: 28, keywords: ["watch", "tv", "television"] },
        { text: "Count sheep", points: 18, keywords: ["count", "sheep", "counting"] },
        { text: "Listen to music", points: 12, keywords: ["listen", "music", "audio"] },
        { text: "Get a snack", points: 10, keywords: ["snack", "eat", "food"] }
      ]
    };
  }
}

/**
 * Parse AI response to extract question and answers
 */
function parseAIResponse(response: string): FamilyFeudQuestion {
  try {
    // Extract question
    const questionMatch = response.match(/Question:\s*(.+?)(?:\n|$)/i);
    const question = questionMatch ? questionMatch[1].trim() : "Name something people do when they can't sleep";

    // Extract answers
    const answerMatches = response.matchAll(/(\d+)\.\s*(.+?)\s*-\s*(\d+)/g);
    const answers = [];
    
    for (const match of answerMatches) {
      const text = match[2].trim();
      const points = parseInt(match[3]);
      const keywords = generateKeywords(text);
      
      answers.push({ text, points, keywords });
    }

    // If we didn't get 5 answers, fill with defaults
    while (answers.length < 5) {
      answers.push({
        text: `Answer ${answers.length + 1}`,
        points: Math.max(1, 20 - answers.length * 3),
        keywords: [`answer${answers.length + 1}`]
      });
    }

    return { question, answers: answers.slice(0, 5) };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    // Return default question
    return {
      question: "Name something people do when they can't sleep",
      answers: [
        { text: "Read a book", points: 32, keywords: ["read", "book", "reading"] },
        { text: "Watch TV", points: 28, keywords: ["watch", "tv", "television"] },
        { text: "Count sheep", points: 18, keywords: ["count", "sheep", "counting"] },
        { text: "Listen to music", points: 12, keywords: ["listen", "music", "audio"] },
        { text: "Get a snack", points: 10, keywords: ["snack", "eat", "food"] }
      ]
    };
  }
}

/**
 * Generate keywords for better answer matching
 */
function generateKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  // Add common synonyms and variations
  const synonyms: Record<string, string[]> = {
    'read': ['reading', 'book', 'novel', 'magazine'],
    'watch': ['watching', 'tv', 'television', 'show', 'movie'],
    'listen': ['listening', 'music', 'audio', 'song'],
    'eat': ['eating', 'food', 'snack', 'meal'],
    'sleep': ['sleeping', 'bed', 'rest', 'nap'],
    'work': ['working', 'job', 'office', 'business'],
    'play': ['playing', 'game', 'sport', 'fun'],
    'cook': ['cooking', 'kitchen', 'food', 'meal'],
    'clean': ['cleaning', 'house', 'home', 'tidy'],
    'shop': ['shopping', 'store', 'buy', 'purchase']
  };

  const allKeywords = [...words];
  words.forEach(word => {
    if (synonyms[word]) {
      allKeywords.push(...synonyms[word]);
    }
  });

  return [...new Set(allKeywords)];
}

/**
 * Get AI guess using DeepSeek-R1
 */
export async function getAIGuess(
  question: string,
  revealedAnswers: Array<{ text: string; points: number }>,
  allAnswers: Array<{ text: string; points: number; keywords: string[] }>
): Promise<AIGuessResult> {
  const revealedTexts = revealedAnswers.map(a => a.text);
  const unrevealedAnswers = allAnswers.filter(a => !revealedTexts.includes(a.text));
  
  const prompt = `You are playing Family Feud. Here's the question:

"${question}"

The following answers have already been revealed:
${revealedTexts.length > 0 ? revealedTexts.map((text, i) => `${i + 1}. ${text}`).join('\n') : 'None yet'}

You need to guess one of the remaining answers. Think about what common responses people would give to this question.

Respond with just a short, simple answer (1-3 words maximum). Don't explain or add anything else - just the answer.`;

  const messages: ChatMessage[] = [
    { type: 'user', content: prompt }
  ];

  try {
    const response = await sendChatMessage(messages, 'DeepSeek-R1');
    const guess = response.trim().toLowerCase();
    
    // Check if the guess matches any unrevealed answer
    const matchResult = checkAnswerMatch(guess, unrevealedAnswers);
    
    return {
      guess: response.trim(),
      confidence: matchResult ? 0.8 : 0.3,
      isCorrect: !!matchResult,
      matchedAnswer: matchResult || undefined
    };
  } catch (error) {
    console.error('Failed to get AI guess:', error);
    // Return a random guess
    const randomGuess = unrevealedAnswers[Math.floor(Math.random() * unrevealedAnswers.length)];
    const randomIndex = allAnswers.findIndex(a => a.text === randomGuess.text);
    return {
      guess: randomGuess.text,
      confidence: 0.5,
      isCorrect: true,
      matchedAnswer: {
        text: randomGuess.text,
        points: randomGuess.points,
        index: randomIndex
      }
    };
  }
}

/**
 * Check if a player's guess matches any answer
 */
export function checkPlayerGuess(
  guess: string,
  allAnswers: Array<{ text: string; points: number; keywords: string[] }>,
  revealedAnswers: Array<{ text: string; points: number }>
): AIGuessResult {
  const guessLower = guess.toLowerCase().trim();
  const revealedTexts = revealedAnswers.map(a => a.text.toLowerCase());
  const unrevealedAnswers = allAnswers.filter(a => !revealedTexts.includes(a.text.toLowerCase()));
  
  const matchResult = checkAnswerMatch(guessLower, unrevealedAnswers);
  
  return {
    guess: guess.trim(),
    confidence: matchResult ? 1.0 : 0.0,
    isCorrect: !!matchResult,
    matchedAnswer: matchResult || undefined
  };
}

/**
 * Check if a guess matches any answer using fuzzy matching
 */
function checkAnswerMatch(
  guess: string,
  answers: Array<{ text: string; points: number; keywords: string[] }>
): { text: string; points: number; index: number } | null {
  
  for (let i = 0; i < answers.length; i++) {
    const answer = answers[i];
    const answerLower = answer.text.toLowerCase();
    
    // Exact match
    if (guess === answerLower) {
      return { text: answer.text, points: answer.points, index: i };
    }
    
    // Contains match
    if (answerLower.includes(guess) || guess.includes(answerLower)) {
      return { text: answer.text, points: answer.points, index: i };
    }
    
    // Keyword match
    const guessWords = guess.split(/\s+/);
    const keywordMatches = answer.keywords.filter(keyword => 
      guessWords.some(word => 
        word.includes(keyword) || keyword.includes(word)
      )
    );
    
    if (keywordMatches.length > 0) {
      return { text: answer.text, points: answer.points, index: i };
    }
    
    // Synonym matching
    const synonyms: Record<string, string[]> = {
      'tv': ['television', 'show', 'movie'],
      'book': ['reading', 'novel', 'magazine'],
      'music': ['song', 'audio', 'sound'],
      'food': ['eat', 'meal', 'snack'],
      'sleep': ['bed', 'rest', 'nap'],
      'work': ['job', 'office', 'business'],
      'play': ['game', 'sport', 'fun'],
      'cook': ['kitchen', 'food', 'meal'],
      'clean': ['house', 'home', 'tidy'],
      'shop': ['store', 'buy', 'purchase']
    };
    
    for (const [synonym, variations] of Object.entries(synonyms)) {
      if (guess.includes(synonym) || variations.some(v => guess.includes(v))) {
        if (answerLower.includes(synonym) || variations.some(v => answerLower.includes(v))) {
          return { text: answer.text, points: answer.points, index: i };
        }
      }
    }
  }
  
  return null;
} 