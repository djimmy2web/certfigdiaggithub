"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface QuizQuestion {
  id: string;
  type: 'vocabulary' | 'thematic';
  question: string;
  correctAnswer: string;
  wrongAnswers: string[];
  difficulty: "debutant" | "intermediaire" | "expert";
  category?: string;
  source: 'user-error' | 'random';
  originalError?: {
    userAnswer: string;
    correctAnswer: string;
  };
}

interface QuizData {
  title: string;
  description: string;
  questions: QuizQuestion[];
  totalQuestions: number;
  source: 'user-errors' | 'random';
  stats?: {
    totalErrors: number;
    vocabularyErrors: number;
    thematicErrors: number;
    daysCovered: number;
    errorRate: number;
  };
}

interface QuizState {
  currentQuestionIndex: number;
  score: number;
  totalQuestions: number;
  showResult: boolean;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  completed: boolean;
  lives: number;
}

interface ErrorStats {
  totalErrors: number;
  recentErrors: number;
  vocabularyErrors: number;
  thematicErrors: number;
  errorRate: number;
  daysCovered: number;
  difficultyBreakdown: Array<{ _id: string; count: number }>;
  categoryBreakdown: Array<{ _id: string; count: number }>;
  weeklyTrend: Array<{ date: string; count: number }>;
  recommendations: string[];
}

export default function ErreursRecentesPage() {
  const { data: session } = useSession();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    score: 0,
    totalQuestions: 0,
    showResult: false,
    selectedAnswer: null,
    isCorrect: null,
    completed: false,
    lives: 3
  });

  useEffect(() => {
    if (!session?.user) return;

    const fetchData = async () => {
      try {
        // Récupérer le quiz des erreurs récentes
        const quizResponse = await fetch('/api/user-errors/recent-quiz?limit=10&days=30');
        const quizResult = await quizResponse.json();
        
        if (!quizResponse.ok) {
          throw new Error(quizResult.error || 'Erreur lors du chargement du quiz');
        }
        
        setQuizData(quizResult.quiz);
        
        // Récupérer les statistiques des erreurs
        const statsResponse = await fetch('/api/user-errors/stats?days=30');
        const statsResult = await statsResponse.json();
        
        if (statsResponse.ok) {
          setErrorStats(statsResult.stats);
        }
        
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erreur');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const getDifficultyInfo = (difficulty: string) => {
    switch (difficulty) {
      case "debutant":
        return { label: "Facile", emoji: "🖐️", color: "bg-green-100 text-green-800" };
      case "intermediaire":
        return { label: "Moyen", emoji: "🧠", color: "bg-yellow-100 text-yellow-800" };
      case "expert":
        return { label: "Difficile", emoji: "🏆", color: "bg-red-100 text-red-800" };
      default:
        return { label: "Tous niveaux", emoji: "📚", color: "bg-gray-100 text-gray-800" };
    }
  };

  const startQuiz = () => {
    if (!quizData) return;
    
    setQuizStarted(true);
    setQuizState({
      currentQuestionIndex: 0,
      score: 0,
      totalQuestions: quizData.questions.length,
      showResult: false,
      selectedAnswer: null,
      isCorrect: null,
      completed: false,
      lives: 3
    });
  };

  const handleAnswerSelect = (answer: string) => {
    if (quizState.showResult || !quizData) return;

    const currentQuestion = quizData.questions[quizState.currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;

    setQuizState(prev => ({
      ...prev,
      selectedAnswer: answer,
      isCorrect,
      showResult: true
    }));
  };

  const nextQuestion = () => {
    if (!quizData) return;
    
    const newScore = quizState.isCorrect ? quizState.score + 1 : quizState.score;
    const newLives = quizState.isCorrect ? quizState.lives : quizState.lives - 1;
    const nextIndex = quizState.currentQuestionIndex + 1;
    const isCompleted = nextIndex >= quizData.questions.length || newLives <= 0;

    if (isCompleted) {
      setQuizState(prev => ({
        ...prev,
        score: newScore,
        lives: newLives,
        completed: true
      }));
    } else {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        score: newScore,
        lives: newLives,
        showResult: false,
        selectedAnswer: null,
        isCorrect: null
      }));
    }
  };

  const restartQuiz = () => {
    if (!quizData) return;
    
    setQuizStarted(false);
    setQuizState({
      currentQuestionIndex: 0,
      score: 0,
      totalQuestions: quizData.questions.length,
      showResult: false,
      selectedAnswer: null,
      isCorrect: null,
      completed: false,
      lives: 3
    });
  };

  const getShuffledAnswers = (question: QuizQuestion) => {
    const allAnswers = [question.correctAnswer, ...question.wrongAnswers];
    return allAnswers.sort(() => Math.random() - 0.5);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* En-tête avec gamification */}
          <div className="text-center mb-16">
            <div className="text-8xl mb-6 animate-bounce">🎯</div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-red-600 via-pink-600 to-red-800 bg-clip-text text-transparent mb-6">
              Maîtrise des Erreurs
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Transformez vos erreurs en force ! Chaque erreur corrigée vous rapproche de l&apos;excellence
            </p>
            
            {/* Badge de niveau */}
            <div className="mt-8 inline-flex items-center bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg">
              <span className="mr-2">🔥</span>
              Niveau Erreurs : Expert
              <span className="ml-2">⭐</span>
            </div>
            
            <Link 
              href="/reviser"
              className="inline-flex items-center mt-6 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour à la révision des quiz
            </Link>
          </div>

          {/* Statistiques gamifiées */}
          {errorStats && (
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-3xl shadow-2xl p-10 mb-12 border-2 border-red-200">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                📊 Tableau de Bord des Erreurs
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="text-center group transform hover:scale-110 transition-transform duration-300">
                  <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="text-4xl font-bold mb-2">{errorStats.totalErrors}</div>
                    <div className="text-red-100 font-semibold">Erreurs Totales</div>
                  </div>
                </div>
                <div className="text-center group transform hover:scale-110 transition-transform duration-300">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="text-4xl font-bold mb-2">{errorStats.vocabularyErrors}</div>
                    <div className="text-blue-100 font-semibold">Vocabulaire</div>
                  </div>
                </div>
                <div className="text-center group transform hover:scale-110 transition-transform duration-300">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="text-4xl font-bold mb-2">{errorStats.thematicErrors}</div>
                    <div className="text-green-100 font-semibold">Thématiques</div>
                  </div>
                </div>
                <div className="text-center group transform hover:scale-110 transition-transform duration-300">
                  <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="text-4xl font-bold mb-2">
                      {errorStats.difficultyBreakdown.find(d => d._id === 'expert')?.count || 0}
                    </div>
                    <div className="text-purple-100 font-semibold">Niveau Expert</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Informations du quiz gamifiées */}
          {quizData && (
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-3xl shadow-2xl p-10 mb-12 border-2 border-red-200">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                🎯 Défis de Révision
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                <div className="text-center group transform hover:scale-110 transition-transform duration-300">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="text-4xl font-bold mb-2">{quizData.questions.length}</div>
                    <div className="text-blue-100 font-semibold">Défis</div>
                  </div>
                </div>
                <div className="text-center group transform hover:scale-110 transition-transform duration-300">
                  <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="text-4xl font-bold mb-2">3</div>
                    <div className="text-red-100 font-semibold">Vies</div>
                  </div>
                </div>
                <div className="text-center group transform hover:scale-110 transition-transform duration-300">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="text-4xl font-bold mb-2">4</div>
                    <div className="text-green-100 font-semibold">Choix par défi</div>
                  </div>
                </div>
              </div>
              
              {/* Bouton de démarrage gamifié */}
              <div className="text-center">
                <button
                  onClick={startQuiz}
                  disabled={quizData.questions.length === 0}
                  className={`group py-5 px-12 rounded-2xl transition-all duration-300 font-bold text-xl shadow-2xl transform hover:scale-105 hover:shadow-3xl ${
                    quizData.questions.length === 0 
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700'
                  }`}
                >
                  <span className="mr-3">🚀</span>
                  {quizData.questions.length === 0 ? 'Aucune erreur à réviser' : 'Lancer la Révision'}
                  <span className="ml-3 group-hover:translate-x-2 transition-transform duration-300">⚡</span>
                </button>
              </div>
            </div>
          )}

          {/* Message si aucune erreur */}
          {(!quizData || quizData.questions.length === 0) && (
            <div className="text-center py-12">
              <div className="text-8xl mb-6 animate-bounce">🎉</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Aucune erreur récente !
              </h3>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Continuez à vous entraîner pour maintenir ce niveau d&apos;excellence. 
                Vos performances sont remarquables ! 🌟
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (quizState.completed) {
    const percentage = Math.round((quizState.score / quizState.totalQuestions) * 100);
    const getResultMessage = () => {
      if (quizState.lives <= 0) return { message: "Vous avez perdu toutes vos vies ! Continuez à vous entraîner", emoji: "💔" };
      if (percentage >= 90) return { message: "Excellent ! Vous avez bien appris de vos erreurs", emoji: "🏆" };
      if (percentage >= 70) return { message: "Très bien ! Vous progressez", emoji: "🎉" };
      if (percentage >= 50) return { message: "Pas mal ! Continuez à réviser", emoji: "👍" };
      return { message: "Continuez à réviser pour améliorer vos résultats", emoji: "📚" };
    };
    const result = getResultMessage();

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-6xl mb-4">{result.emoji}</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Quiz terminé !
            </h1>
            <p className="text-xl text-gray-600 mb-8">{result.message}</p>
            
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-blue-600 mb-2">{percentage}%</div>
                <div className="text-2xl text-gray-700">
                  {quizState.score} / {quizState.totalQuestions} bonnes réponses
                </div>
                <div className="text-lg text-gray-600 mt-2">
                  Vies restantes: {quizState.lives}
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
                <div 
                  className="bg-blue-600 h-4 rounded-full transition-all duration-1000"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={restartQuiz}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Recommencer
              </button>
              <Link
                href="/reviser"
                className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Retour à la révision des quiz
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quizData) return null;
  
  const currentQuestion = quizData.questions[quizState.currentQuestionIndex];
  const shuffledAnswers = getShuffledAnswers(currentQuestion);
  const difficultyInfo = getDifficultyInfo(currentQuestion.difficulty);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête avec progression et vies */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link 
              href="/reviser"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Retour
            </Link>
            <div className="text-sm text-gray-600">
              Question {quizState.currentQuestionIndex + 1} / {quizState.totalQuestions}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Vies:</span>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full ${
                    i < quizState.lives ? 'bg-red-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((quizState.currentQuestionIndex + 1) / quizState.totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${difficultyInfo.color} mb-4`}>
              {difficultyInfo.emoji} {difficultyInfo.label}
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {currentQuestion.question}
            </h2>
            <div className="text-sm text-gray-600 mb-4">
              📚 {currentQuestion.type === 'vocabulary' ? 'Vocabulaire' : 'Thématique'} • {currentQuestion.category || 'Général'}
            </div>
          </div>

          {/* Réponses */}
          <div className="space-y-4">
            {shuffledAnswers.map((answer, index) => {
              const isSelected = quizState.selectedAnswer === answer;
              const isCorrectAnswer = answer === currentQuestion.correctAnswer;
              let buttonClass = "w-full p-4 rounded-lg border-2 transition-all duration-200 text-left";
              
              if (quizState.showResult) {
                if (isCorrectAnswer) {
                  buttonClass += " bg-green-100 border-green-500 text-green-800";
                } else if (isSelected) {
                  buttonClass += " bg-red-100 border-red-500 text-red-800";
                } else {
                  buttonClass += " bg-gray-100 border-gray-300 text-gray-600";
                }
              } else {
                buttonClass += isSelected 
                  ? " bg-blue-100 border-blue-500 text-blue-800" 
                  : " bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-blue-300";
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(answer)}
                  disabled={quizState.showResult}
                  className={buttonClass}
                >
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center text-sm font-bold">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="font-medium">{answer}</span>
                    {quizState.showResult && isCorrectAnswer && (
                      <div className="ml-auto text-green-600">✓</div>
                    )}
                    {quizState.showResult && isSelected && !isCorrectAnswer && (
                      <div className="ml-auto text-red-600">✗</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bouton suivant */}
          {quizState.showResult && (
            <div className="mt-6 text-center">
              <div className={`text-lg font-semibold mb-4 ${
                quizState.isCorrect ? 'text-green-600' : 'text-red-600'
              }`}>
                {quizState.isCorrect ? '✅ Correct !' : '❌ Incorrect'}
              </div>
              {!quizState.isCorrect && currentQuestion.originalError && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Votre erreur précédente :</strong> {currentQuestion.originalError.userAnswer}
                  </p>
                </div>
              )}
              <button
                onClick={nextQuestion}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                {quizState.currentQuestionIndex + 1 >= quizData.questions.length || quizState.lives <= 1 ? 'Voir les résultats' : 'Question suivante'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
