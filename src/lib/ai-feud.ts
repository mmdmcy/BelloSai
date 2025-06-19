/**
 * AI Feud Game Logic and AI Integration
 * 
 * This module implements the complete game logic for the AI Feud game, a Family Feud-style
 * game where players compete against AI to guess the most popular survey answers.
 * 
 * Game Architecture:
 * - Question generation using DeepSeek-V3 for creative, varied questions
 * - AI opponent powered by DeepSeek-R1 for strategic answer guessing
 * - Flexible answer matching system with keyword-based scoring
 * - Real-time scoring and game state management
 * 
 * AI Integration:
 * - DeepSeek-V3: Generates original questions with 5 answers and point values
 * - DeepSeek-R1: Acts as AI opponent with strategic thinking and adaptation
 * - Advanced prompt engineering for consistent output formatting
 * - Fallback mechanisms for robust error handling
 * 
 * Answer Matching Features:
 * - Fuzzy string matching for user-friendly input
 * - Keyword extraction and synonym matching
 * - Case-insensitive matching with partial word support
 * - Duplicate answer prevention
 * - Progressive difficulty with revealed answers
 * 
 * Game Mechanics:
 * - Survey-style questions with point-based answers (totaling 100 points)
 * - Turn-based gameplay between human and AI players
 * - Strategic AI that adapts based on revealed answers
 * - Confidence scoring for AI guesses
 * - Multiple game modes and difficulty levels
 * 
 * Content Generation:
 * - Modern, relatable questions covering current topics
 * - Technology, social media, lifestyle, and pop culture themes
 * - Automated variety to prevent repetitive gameplay
 * - Family-friendly content suitable for all ages
 */

import { sendChatMessage, ChatMessage } from './supabase-chat';

export interface AIFeudQuestion {
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
 * Generate an AI Feud question using DeepSeek-V3
 */
export async function generateAIFeudQuestion(): Promise<AIFeudQuestion> {
  // Create a more varied and creative prompt
  const prompts = [
    `Generate a creative AI Feud style question with exactly 5 answers and their point values. Make it fun and engaging!

IMPORTANT: Do NOT use any markdown formatting like **, *, #, or any special characters. Just use plain text.

The format should be:
Question: [A creative, fun question that people would be surveyed about]
Answers:
1. [Answer 1] - [Points 1-50]
2. [Answer 2] - [Points 1-50] 
3. [Answer 3] - [Points 1-50]
4. [Answer 4] - [Points 1-50]
5. [Answer 5] - [Points 1-50]

Make sure:
- Total points add up to 100
- Answers are common, relatable responses
- Question is creative and different from typical AI Feud questions
- Points are realistic (higher for more common answers)
- Make it about modern life, technology, social media, food, travel, hobbies, etc.
- Use ONLY plain text, no formatting

Generate a unique question:`,
    
    `Create an original AI Feud question that hasn't been used before. Think outside the box!

IMPORTANT: Use plain text only. No markdown, no asterisks, no special formatting.

Format:
Question: [Something creative and modern]
Answers:
1. [Answer] - [Points]
2. [Answer] - [Points]
3. [Answer] - [Points]
4. [Answer] - [Points]
5. [Answer] - [Points]

Make it about:
- Social media trends
- Modern technology
- Current events
- Food and dining
- Travel and vacation
- Work and careers
- Relationships and dating
- Entertainment and pop culture

Be creative and original! Use plain text only.`,

    `Invent a completely new AI Feud question that would be fun to play. Make it contemporary and relatable.

IMPORTANT: Plain text only. No formatting, no asterisks, no markdown.

Question: [Your creative question here]
Answers:
1. [Answer] - [Points]
2. [Answer] - [Points]
3. [Answer] - [Points]
4. [Answer] - [Points]
5. [Answer] - [Points]

Think about:
- What people do in their free time
- Modern problems and solutions
- Popular apps and websites
- Current trends and fads
- Everyday situations
- Funny or embarrassing moments

Make it fresh and entertaining! Plain text only.`
  ];

  // Randomly select a prompt for variety
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

  const messages: ChatMessage[] = [
    { type: 'user', content: randomPrompt }
  ];

  try {
    const response = await sendChatMessage(messages, 'DeepSeek-V3');
    
    // Parse the response to extract question and answers
    const parsed = parseAIResponse(response);
    return parsed;
  } catch (error) {
    console.error('Failed to generate AI Feud question:', error);
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
function parseAIResponse(response: string): AIFeudQuestion {
  try {
    // Clean up markdown formatting
    const cleanResponse = response
      .replace(/\*\*/g, '') // Remove bold
      .replace(/\*/g, '')   // Remove italics
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/`/g, '')    // Remove code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .trim();
    
    // Extract question - be more flexible with parsing
    const questionMatch = cleanResponse.match(/Question:\s*(.+?)(?:\n|$)/i) || 
                         cleanResponse.match(/^(.+?)(?:\n|$)/i);
    const question = questionMatch ? questionMatch[1].trim() : "Name something people do when they can't sleep";

    // Extract answers - be more flexible with different formats
    const answerMatches = cleanResponse.matchAll(/(\d+)\.\s*(.+?)\s*-\s*(\d+)/g) || 
                         cleanResponse.matchAll(/(\d+)\)\s*(.+?)\s*-\s*(\d+)/g) ||
                         cleanResponse.matchAll(/(\d+)\s*(.+?)\s*-\s*(\d+)/g);
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
  
  // Expanded synonyms and variations for better matching
  const synonyms: Record<string, string[]> = {
    'read': ['reading', 'book', 'novel', 'magazine', 'newspaper', 'article'],
    'watch': ['watching', 'tv', 'television', 'show', 'movie', 'film', 'video', 'stream'],
    'listen': ['listening', 'music', 'audio', 'song', 'podcast', 'radio'],
    'eat': ['eating', 'food', 'snack', 'meal', 'dinner', 'lunch', 'breakfast'],
    'sleep': ['sleeping', 'bed', 'rest', 'nap', 'doze', 'snooze'],
    'work': ['working', 'job', 'office', 'business', 'career', 'profession'],
    'play': ['playing', 'game', 'sport', 'fun', 'entertainment', 'hobby'],
    'cook': ['cooking', 'kitchen', 'food', 'meal', 'prepare', 'bake', 'grill'],
    'clean': ['cleaning', 'house', 'home', 'tidy', 'organize', 'dust', 'vacuum'],
    'shop': ['shopping', 'store', 'buy', 'purchase', 'mall', 'market'],
    'drive': ['driving', 'car', 'vehicle', 'transport', 'commute'],
    'walk': ['walking', 'exercise', 'stroll', 'hike', 'jog'],
    'call': ['calling', 'phone', 'telephone', 'contact', 'ring'],
    'text': ['texting', 'message', 'sms', 'chat', 'communicate'],
    'post': ['posting', 'social', 'media', 'share', 'upload'],
    'check': ['checking', 'look', 'view', 'examine', 'inspect'],
    'search': ['searching', 'find', 'lookup', 'google', 'browse'],
    'order': ['ordering', 'buy', 'purchase', 'delivery', 'takeout'],
    'meet': ['meeting', 'see', 'visit', 'hangout', 'socialize'],
    'study': ['studying', 'learn', 'school', 'education', 'homework']
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
  
  console.log('🔍 getAIGuess called with:');
  console.log('  - Question:', question);
  console.log('  - Revealed:', revealedTexts);
  console.log('  - Available options:', unrevealedAnswers.map(a => a.text));
  
  const prompt = `AI Feud game. Question: "${question}"

Revealed: ${revealedTexts.length > 0 ? revealedTexts.join(', ') : 'None'}

Pick ONE answer from:
${unrevealedAnswers.map(a => a.text).join(', ')}

Reply with ONLY the answer text. No explanations.`;

  console.log('📝 Sending prompt to DeepSeek-R1:');
  console.log(prompt);

  const messages: ChatMessage[] = [
    { type: 'user', content: prompt }
  ];

  try {
    console.log('⏱️ Starting AI request with 8 second timeout...');
    
    // Shorter timeout for faster response
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        console.log('⏰ AI request timed out after 8 seconds');
        reject(new Error('AI request timeout after 8 seconds'));
      }, 8000); // 8 second timeout
    });

    const responsePromise = sendChatMessage(messages, 'DeepSeek-R1');
    
    console.log('🔄 Waiting for AI response...');
    const response = await Promise.race([responsePromise, timeoutPromise]);
    
    console.log('📨 Raw AI response:', response);
    const guess = response.trim();
    console.log('🧹 Cleaned guess:', guess);
    
    // Check if the guess matches any unrevealed answer exactly
    const matchResult = unrevealedAnswers.findIndex(a => 
      a.text.toLowerCase() === guess.toLowerCase()
    );
    
    console.log('🔍 Matching result:', matchResult);
    console.log('🎯 Looking for exact match with:', unrevealedAnswers.map(a => a.text));
    
    if (matchResult !== -1) {
      const matchedAnswer = unrevealedAnswers[matchResult];
      const allAnswersIndex = allAnswers.findIndex(a => a.text === matchedAnswer.text);
      
      console.log('✅ Exact match found:', matchedAnswer.text);
      
      return {
        guess: guess,
        confidence: 1.0,
        isCorrect: true,
        matchedAnswer: {
          text: matchedAnswer.text,
          points: matchedAnswer.points,
          index: allAnswersIndex
        }
      };
    } else {
      console.log('❌ No exact match found. AI guessed:', guess);
      console.log('Expected options were:', unrevealedAnswers.map(a => a.text));
      
      return {
        guess: guess,
        confidence: 0.0,
        isCorrect: false
      };
    }
  } catch (error) {
    console.error('💥 getAIGuess failed with error:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'No message');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    throw error; // Let the component handle the error
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
    
    // Expanded synonym matching
    const synonyms: Record<string, string[]> = {
      'tv': ['television', 'show', 'movie', 'film', 'video', 'stream'],
      'book': ['reading', 'novel', 'magazine', 'newspaper', 'article'],
      'music': ['song', 'audio', 'sound', 'podcast', 'radio'],
      'food': ['eat', 'meal', 'snack', 'dinner', 'lunch', 'breakfast'],
      'sleep': ['bed', 'rest', 'nap', 'doze', 'snooze'],
      'work': ['job', 'office', 'business', 'career', 'profession'],
      'play': ['game', 'sport', 'fun', 'entertainment', 'hobby'],
      'cook': ['kitchen', 'food', 'meal', 'prepare', 'bake', 'grill'],
      'clean': ['house', 'home', 'tidy', 'organize', 'dust', 'vacuum'],
      'shop': ['store', 'buy', 'purchase', 'mall', 'market'],
      'drive': ['car', 'vehicle', 'transport', 'commute'],
      'walk': ['exercise', 'stroll', 'hike', 'jog'],
      'call': ['phone', 'telephone', 'contact', 'ring'],
      'text': ['message', 'sms', 'chat', 'communicate'],
      'post': ['social', 'media', 'share', 'upload'],
      'check': ['look', 'view', 'examine', 'inspect'],
      'search': ['find', 'lookup', 'google', 'browse'],
      'order': ['buy', 'purchase', 'delivery', 'takeout'],
      'meet': ['see', 'visit', 'hangout', 'socialize'],
      'study': ['learn', 'school', 'education', 'homework']
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
