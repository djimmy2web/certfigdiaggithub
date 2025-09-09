"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface VocabularyWord {
  _id: string;
  word: string;
  correctDefinition: string;
  wrongDefinitions: string[];
  difficulty: "debutant" | "intermediaire" | "expert";
  category?: string;
}

interface QuizState {
  currentWordIndex: number;
  score: number;
  totalQuestions: number;
  showResult: boolean;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  completed: boolean;
}

export default function VocabulairePage() {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [quizState, setQuizState] = useState<QuizState>({
    currentWordIndex: 0,
    score: 0,
    totalQuestions: 0,
    showResult: false,
    selectedAnswer: null,
    isCorrect: null,
    completed: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    const fetchVocabularyWords = async () => {
      try {
        // Récupérer les mots depuis l'API avec mélange aléatoire
        const res = await fetch("/api/vocabulary?random=true&limit=10");
        const data = await res.json();
        
        if (!res.ok) throw new Error(data?.error || "Erreur lors du chargement");
        
        if (data.success && data.words) {
          setWords(data.words);
          setQuizState(prev => ({ ...prev, totalQuestions: data.words.length }));
        } else {
          throw new Error("Aucun mot de vocabulaire trouvé");
        }
      } catch (e: unknown) {
        setError((e as Error).message || "Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };

    fetchVocabularyWords();
  }, []);

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
    setQuizStarted(true);
    setQuizState({
      currentWordIndex: 0,
      score: 0,
      totalQuestions: words.length,
      showResult: false,
      selectedAnswer: null,
      isCorrect: null,
      completed: false
    });
  };

  const handleAnswerSelect = async (answer: string) => {
    if (quizState.showResult) return; // Empêcher de changer de réponse après sélection

    const currentWord = words[quizState.currentWordIndex];
    const isCorrect = answer === currentWord.correctDefinition;

    // Enregistrer l'erreur si la réponse est incorrecte
    if (!isCorrect) {
      try {
        await fetch('/api/user-errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizType: 'vocabulary',
            questionId: currentWord._id,
            question: `Quel est le sens du mot &quot;${currentWord.word}&quot; ?`,
            userAnswer: answer,
            correctAnswer: currentWord.correctDefinition,
            quizTitle: 'Quiz de Vocabulaire',
            difficulty: currentWord.difficulty,
            category: currentWord.category
          })
        });
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'erreur:', error);
      }
    }

    setQuizState(prev => ({
      ...prev,
      selectedAnswer: answer,
      isCorrect,
      showResult: true
    }));
  };

  const nextQuestion = () => {
    const newScore = quizState.isCorrect ? quizState.score + 1 : quizState.score;
    const nextIndex = quizState.currentWordIndex + 1;
    const isCompleted = nextIndex >= words.length;

    if (isCompleted) {
      setQuizState(prev => ({
        ...prev,
        score: newScore,
        completed: true
      }));
    } else {
      setQuizState(prev => ({
        ...prev,
        currentWordIndex: nextIndex,
        score: newScore,
        showResult: false,
        selectedAnswer: null,
        isCorrect: null
      }));
    }
  };

  const restartQuiz = () => {
    setQuizStarted(false);
    setQuizState({
      currentWordIndex: 0,
      score: 0,
      totalQuestions: words.length,
      showResult: false,
      selectedAnswer: null,
      isCorrect: null,
      completed: false
    });
  };

  const getShuffledAnswers = (word: VocabularyWord) => {
    if (!word || !word.correctDefinition || !word.wrongDefinitions) {
      return [];
    }
    const allAnswers = [word.correctDefinition, ...word.wrongDefinitions];
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
            <div className="text-8xl mb-6 animate-bounce">📚</div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-800 bg-clip-text text-transparent mb-6">
              Maîtrise du Vocabulaire
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Débloquez votre potentiel linguistique ! Chaque mot maîtrisé vous rapproche du niveau Expert
            </p>
            
            {/* Badge de niveau */}
            <div className="mt-8 inline-flex items-center bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg">
              <span className="mr-2">🎯</span>
              Niveau Vocabulaire : Expert
              <span className="ml-2">⭐</span>
            </div>
            
            <Link 
              href="/reviser"
              className="inline-flex items-center mt-6 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour à la révision
            </Link>
          </div>

          {/* Informations du quiz gamifiées */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl shadow-2xl p-10 mb-12 border-2 border-blue-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              🎯 Défis du Vocabulaire
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              <div className="text-center group transform hover:scale-110 transition-transform duration-300">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
                  <div className="text-4xl font-bold mb-2">{words.length}</div>
                  <div className="text-blue-100 font-semibold">Défis</div>
                </div>
              </div>
              <div className="text-center group transform hover:scale-110 transition-transform duration-300">
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-lg">
                  <div className="text-4xl font-bold mb-2">3</div>
                  <div className="text-green-100 font-semibold">Choix par défi</div>
                </div>
              </div>
              <div className="text-center group transform hover:scale-110 transition-transform duration-300">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl p-6 text-white shadow-lg">
                  <div className="text-4xl font-bold mb-2">
                    {words.filter(w => w.difficulty === 'expert').length}
                  </div>
                  <div className="text-purple-100 font-semibold">Niveau Expert</div>
                </div>
              </div>
            </div>
            
            {/* Bouton de démarrage gamifié */}
            <div className="text-center">
              <button
                onClick={startQuiz}
                className="group bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-5 px-12 rounded-2xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-bold text-xl shadow-2xl transform hover:scale-105 hover:shadow-3xl"
              >
                <span className="mr-3">🚀</span>
                Lancer l&apos;Aventure Vocabulaire
                <span className="ml-3 group-hover:translate-x-2 transition-transform duration-300">⚡</span>
              </button>
            </div>
          </div>

          {/* Section de conseils */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">💡 Conseils pour réussir</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">📖 Lisez attentivement</h4>
                <p className="text-blue-100">Prenez le temps de lire toutes les définitions</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🤔 Analysez le contexte</h4>
                <p className="text-blue-100">Utilisez le contexte pour éliminer les mauvaises réponses</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">⏰ Prenez votre temps</h4>
                <p className="text-blue-100">Ne vous précipitez pas, réfléchissez bien</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">�� Apprenez de vos erreurs</h4>
                <p className="text-blue-100">Notez les mots que vous ne connaissiez pas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (quizState.completed) {
    const percentage = Math.round((quizState.score / quizState.totalQuestions) * 100);
    const getResultMessage = () => {
      if (percentage >= 90) return { message: "Excellent ! Vous maîtrisez parfaitement ce vocabulaire", emoji: "🏆" };
      if (percentage >= 70) return { message: "Très bien ! Vous avez une bonne connaissance", emoji: "🎉" };
      if (percentage >= 50) return { message: "Pas mal ! Continuez à progresser", emoji: "👍" };
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
                Retour à la révision
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentWord = words[quizState.currentWordIndex];
  
  if (!currentWord) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600">Aucun mot trouvé pour cette question</p>
        </div>
      </div>
    );
  }
  
  const shuffledAnswers = getShuffledAnswers(currentWord);
  const difficultyInfo = getDifficultyInfo(currentWord.difficulty);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête avec progression */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link 
              href="/reviser"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Retour
            </Link>
            <div className="text-sm text-gray-600">
              Question {quizState.currentWordIndex + 1} / {quizState.totalQuestions}
            </div>
            <div className="text-sm text-gray-600">
              Score: {quizState.score}
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((quizState.currentWordIndex + 1) / quizState.totalQuestions) * 100}%` }}
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
              Quel est le sens du mot <span className="text-blue-600">&quot;{currentWord.word}&quot;</span> ?
            </h2>
          </div>

          {/* Réponses */}
          <div className="space-y-4">
            {shuffledAnswers.map((answer, index) => {
              const isSelected = quizState.selectedAnswer === answer;
              const isCorrectAnswer = answer === currentWord.correctDefinition;
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
              <button
                onClick={nextQuestion}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                {quizState.currentWordIndex + 1 >= words.length ? 'Voir les résultats' : 'Question suivante'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
