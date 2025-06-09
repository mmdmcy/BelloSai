import React, { useState, useEffect } from 'react';
import { ArrowLeft, Brain, Clock, CheckCircle, XCircle, Star, RotateCcw } from 'lucide-react';
import { CustomizationSettings } from '../App';

interface QuizProps {
  isDark: boolean;
  customization: CustomizationSettings;
  onBack: () => void;
  onBackToChat: () => void;
  onToggleTheme: () => void;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  category: string;
  explanation: string;
}

export default function Quiz({ isDark, customization, onBack, onBackToChat, onToggleTheme }: QuizProps) {
  const [quizState, setQuizState] = useState<'intro' | 'playing' | 'finished'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  const questions: QuizQuestion[] = [
    {
      id: 1,
      question: "What is the capital of Australia?",
      options: ["Sydney", "Melbourne", "Canberra", "Perth"],
      correct: 2,
      category: "Geography",
      explanation: "Canberra is the capital city of Australia, located in the Australian Capital Territory."
    },
    {
      id: 2,
      question: "Which element has the chemical symbol 'O'?",
      options: ["Gold", "Oxygen", "Silver", "Iron"],
      correct: 1,
      category: "Science",
      explanation: "Oxygen is a chemical element with the symbol O and atomic number 8."
    },
    {
      id: 3,
      question: "Who painted the Mona Lisa?",
      options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
      correct: 2,
      category: "Art",
      explanation: "The Mona Lisa was painted by Leonardo da Vinci between 1503 and 1519."
    },
    {
      id: 4,
      question: "What is the largest ocean on Earth?",
      options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
      correct: 3,
      category: "Geography",
      explanation: "The Pacific Ocean is the largest and deepest ocean on Earth, covering about 46% of the world's ocean surface."
    },
    {
      id: 5,
      question: "In which year did the Berlin Wall fall?",
      options: ["1987", "1989", "1991", "1993"],
      correct: 1,
      category: "History",
      explanation: "The Berlin Wall fell on November 9, 1989, marking a pivotal moment in the end of the Cold War."
    },
    {
      id: 6,
      question: "What is the smallest planet in our solar system?",
      options: ["Venus", "Mars", "Mercury", "Pluto"],
      correct: 2,
      category: "Science",
      explanation: "Mercury is the smallest planet in our solar system, with a diameter of about 4,879 kilometers."
    },
    {
      id: 7,
      question: "Which Shakespeare play features the characters Romeo and Juliet?",
      options: ["Hamlet", "Macbeth", "Romeo and Juliet", "Othello"],
      correct: 2,
      category: "Literature",
      explanation: "Romeo and Juliet is a tragedy written by William Shakespeare about two young star-crossed lovers."
    },
    {
      id: 8,
      question: "What is the currency of Japan?",
      options: ["Yuan", "Won", "Yen", "Ringgit"],
      correct: 2,
      category: "Geography",
      explanation: "The Japanese yen is the official currency of Japan and is the third most traded currency in the foreign exchange market."
    }
  ];

  useEffect(() => {
    if (quizState === 'playing' && timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult) {
      handleAnswer(null);
    }
  }, [timeLeft, quizState, showResult]);

  const startQuiz = () => {
    setQuizState('playing');
    setCurrentQuestion(0);
    setScore(0);
    setTimeLeft(15);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswers([]);
  };

  const handleAnswer = (answerIndex: number | null) => {
    if (showResult) return;

    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);

    const question = questions[currentQuestion];
    if (answerIndex === question.correct) {
      setScore(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setTimeLeft(15);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setQuizState('finished');
      }
    }, 3000);
  };

  const getScoreMessage = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 90) return "Outstanding! You're a quiz master!";
    if (percentage >= 80) return "Excellent work! Great knowledge!";
    if (percentage >= 70) return "Good job! Well done!";
    if (percentage >= 60) return "Not bad! Keep learning!";
    return "Keep practicing! You'll improve!";
  };

  const getScoreColor = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 80) return customization.primaryColor;
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (quizState === 'intro') {
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
              <Brain className="w-6 h-6" />
              <h1 className="text-xl font-semibold">Knowledge Quiz</h1>
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
              <Brain className="w-12 h-12 text-white" />
            </div>
            
            <h2 
              className={`text-4xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}
              style={{ 
                color: isDark 
                  ? (customization.primaryColor !== '#7c3aed' ? customization.primaryColor : undefined)
                  : customization.primaryColor
              }}
            >
              Test Your Knowledge!
            </h2>
            
            <p className={`text-lg mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Challenge yourself with {questions.length} questions across various topics. You have 15 seconds per question. Let's see how much you know!
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <Brain className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>8 Questions</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Multiple choice format</p>
              </div>
              
              <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <Clock className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
                <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>15 Seconds</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Per question</p>
              </div>
              
              <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <Star className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
                <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Mixed Topics</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Science, History, Geography & more</p>
              </div>
            </div>
            
            <button 
              onClick={startQuiz}
              className="px-8 py-4 text-lg font-semibold text-white rounded-lg transition-colors hover:opacity-90"
              style={{ 
                background: customization.gradientEnabled 
                  ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                  : customization.primaryColor
              }}
            >
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (quizState === 'finished') {
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
            <h1 className="text-xl font-semibold">Quiz Results</h1>
          </div>
          
          <button
            onClick={onBackToChat}
            className="px-4 py-2 rounded-lg transition-colors bg-white/10 hover:bg-white/20 text-white"
          >
            Back to Chat
          </button>
        </div>

        {/* Results Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {/* Score Summary */}
            <div className="text-center mb-8">
              <div 
                className="w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: getScoreColor() }}
              >
                <span className="text-4xl font-bold text-white">{score}/{questions.length}</span>
              </div>
              
              <h2 
                className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
                style={{ 
                  color: isDark 
                    ? (customization.primaryColor !== '#7c3aed' ? customization.primaryColor : undefined)
                    : customization.primaryColor
                }}
              >
                {getScoreMessage()}
              </h2>
              
              <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                You scored {Math.round((score / questions.length) * 100)}% on this quiz
              </p>
            </div>

            {/* Question Review */}
            <div className="space-y-6 mb-8">
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Review Your Answers
              </h3>
              
              {questions.map((question, index) => {
                const userAnswer = answers[index];
                const isCorrect = userAnswer === question.correct;
                
                return (
                  <div 
                    key={question.id}
                    className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : (
                          <XCircle className="w-5 h-5 text-white" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-sm font-medium px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                            {question.category}
                          </span>
                          <span className={`text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {isCorrect ? 'Correct' : userAnswer === null ? 'Time\'s up' : 'Incorrect'}
                          </span>
                        </div>
                        
                        <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {question.question}
                        </h4>
                        
                        <div className="grid md:grid-cols-2 gap-2 mb-3">
                          {question.options.map((option, optionIndex) => (
                            <div 
                              key={optionIndex}
                              className={`p-2 rounded text-sm ${
                                optionIndex === question.correct
                                  ? 'bg-green-100 text-green-800 border border-green-300'
                                  : userAnswer === optionIndex && optionIndex !== question.correct
                                    ? 'bg-red-100 text-red-800 border border-red-300'
                                    : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-700'
                              }`}
                            >
                              <span className="font-medium">{String.fromCharCode(65 + optionIndex)}.</span> {option}
                            </div>
                          ))}
                        </div>
                        
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <strong>Explanation:</strong> {question.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button 
                onClick={startQuiz}
                className="flex items-center gap-2 px-6 py-3 font-semibold text-white rounded-lg transition-colors hover:opacity-90"
                style={{ 
                  background: customization.gradientEnabled 
                    ? `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
                    : customization.primaryColor
                }}
              >
                <RotateCcw className="w-5 h-5" />
                Try Again
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
            <Brain className="w-5 h-5" />
            <span className="font-semibold">Question {currentQuestion + 1} of {questions.length}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-75">Score:</span>
            <span className="font-bold">{score}/{currentQuestion}</span>
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
            Exit Quiz
          </button>
        </div>
      </div>

      {/* Quiz Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <span 
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
            >
              {question.category}
            </span>
            
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
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-lg font-semibold ${
                  selectedAnswer === question.correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {selectedAnswer === question.correct ? (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    <span>Correct!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6" />
                    <span>
                      {selectedAnswer === null ? 'Time\'s up!' : 'Incorrect!'} The answer was {question.options[question.correct]}
                    </span>
                  </>
                )}
              </div>
              
              <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {question.explanation}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}