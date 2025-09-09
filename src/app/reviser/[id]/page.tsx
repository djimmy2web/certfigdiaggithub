"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import ProgressBar from "@/components/ProgressBar";
import LivesHearts from "@/components/LivesHearts";

type Choice = { 
  index: number;
  text: string; 
  media?: { type: "image" | "video"; url: string; filename: string };
};

type Question = { 
  index: number;
  text: string; 
  explanation?: string;
  media?: { type: "image" | "video"; url: string; filename: string };
  choices: Choice[] 
};

type Progress = {
  lives: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  isCompleted: boolean;
  isFailed: boolean;
  startedAt: string;
  lastActivityAt?: string;
  completedAt?: string;
  correctAnswers?: number;
  totalAnswers?: number;
  percentage?: number;
};

type QuizData = {
  id: string;
  title: string;
  description?: string;
  totalQuestions: number;
};

export default function TakeQuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastAnswerResult, setLastAnswerResult] = useState<{
    isCorrect: boolean;
    explanation?: string;
  } | null>(null);

  const startQuiz = useCallback(async () => {
    try {
      const res = await fetch(`/api/quizzes/${id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data?.error || "Erreur");
      
      setProgress(data.progress);
      setCurrentQuestion(data.question);
    } catch (e: unknown) {
      setError((e as Error).message || "Erreur");
    }
  }, [id]);

  const loadQuizProgress = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/quizzes/${id}/progress`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data?.error || "Erreur");
      
      setQuiz(data.quiz);
      
      if (data.hasProgress) {
        setProgress(data.progress);
        
        if (data.progress.isCompleted || data.progress.isFailed) {
          // Quiz terminé, afficher les résultats
          setShowResult(true);
        } else if (data.currentQuestion) {
          // Quiz en cours, afficher la question actuelle
          setCurrentQuestion(data.currentQuestion);
        }
      } else {
        // Pas de progression, démarrer le quiz
        await startQuiz();
      }
    } catch (e: unknown) {
      setError((e as Error).message || "Erreur");
    } finally {
      setLoading(false);
    }
  }, [id, startQuiz]);

  useEffect(() => {
    loadQuizProgress();
  }, [loadQuizProgress]);

  async function submitAnswer() {
    if (selectedChoice === null || !currentQuestion) return;
    
    try {
      setSubmitting(true);
      const res = await fetch(`/api/quizzes/${id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choiceIndex: selectedChoice }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data?.error || "Erreur");
      
      // Afficher le résultat de la réponse
      setLastAnswerResult({
        isCorrect: data.isCorrect,
        explanation: data.explanation,
      });
      
      // Mettre à jour la progression
      setProgress({
        ...progress!,
        lives: data.lives,
        currentQuestionIndex: data.currentQuestionIndex,
        isCompleted: data.isCompleted,
        isFailed: data.isFailed,
      });
      
      // Attendre un peu avant de passer à la question suivante
      setTimeout(() => {
        setLastAnswerResult(null);
        setSelectedChoice(null);
        
        if (data.isCompleted || data.isFailed) {
          // Quiz terminé
          setShowResult(true);
          if (data.finalScore) {
            setProgress(prev => ({
              ...prev!,
              correctAnswers: data.finalScore.correct,
              totalAnswers: data.finalScore.total,
              percentage: data.finalScore.percentage,
            }));
          }
        } else if (data.nextQuestion) {
          // Question suivante
          setCurrentQuestion(data.nextQuestion);
        }
      }, 2000);
      
    } catch (e: unknown) {
      setError((e as Error).message || "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  async function resetQuiz() {
    try {
      const res = await fetch(`/api/quizzes/${id}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!res.ok) throw new Error("Erreur lors de la réinitialisation");
      
      const data = await res.json();
      
      if (data.success) {
        // Mettre à jour directement avec les nouvelles données
        setProgress(data.progress);
        setCurrentQuestion(data.question);
        setShowResult(false);
        setSelectedChoice(null);
        setLastAnswerResult(null);
      }
    } catch (e: unknown) {
      setError((e as Error).message || "Erreur");
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
        <p>Chargement du quiz...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    </div>
  );

  if (!quiz) return (
    <div className="max-w-4xl mx-auto p-6">
      <p>Quiz introuvable</p>
    </div>
  );

  // Affichage des résultats finaux
  if (showResult && progress) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          
          {progress.isCompleted ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-green-800 mb-4">🎉 Quiz terminé avec succès !</h2>
              <div className="text-lg">
                <p>Score : <span className="font-bold">{progress.correctAnswers}</span> / <span className="font-bold">{progress.totalAnswers}</span></p>
                <p>Pourcentage : <span className="font-bold">{progress.percentage}%</span></p>
                <p>Vies restantes : <span className="font-bold">{progress.lives}</span></p>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-red-800 mb-4">💔 Plus de vies disponibles</h2>
              <p className="text-lg">Vous avez perdu toutes vos vies. Essayez de nouveau !</p>
            </div>
          )}
          
          <div className="space-x-4">
            <button 
              onClick={resetQuiz}
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
            >
              Recommencer le quiz
            </button>
            <button 
              onClick={() => router.push('/reviser')}
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300"
            >
              Retour aux quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Affichage de la question actuelle
  if (!currentQuestion || !progress) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* En-tête avec progression et vies */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">{quiz.title}</h1>
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Question {progress.currentQuestionIndex + 1} / {progress.totalQuestions}
            </span>
            <ProgressBar 
              current={progress.currentQuestionIndex + 1} 
              total={progress.totalQuestions}
              showLabel={false}
            />
          </div>
          
          <LivesHearts currentLives={progress.lives} maxLives={5} />
        </div>
      </div>

      {/* Résultat de la dernière réponse */}
      {lastAnswerResult && (
        <div className={`mb-6 p-4 rounded-lg ${
          lastAnswerResult.isCorrect 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">
              {lastAnswerResult.isCorrect ? '✅' : '❌'}
            </span>
            <span className="font-semibold">
              {lastAnswerResult.isCorrect ? 'Correct !' : 'Incorrect'}
            </span>
          </div>
          {lastAnswerResult.explanation && (
            <p className="mt-2 text-sm">{lastAnswerResult.explanation}</p>
          )}
        </div>
      )}

      {/* Question actuelle */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {currentQuestion.index + 1}. {currentQuestion.text}
          </h2>
          
          {currentQuestion.media && (
            <div className="mb-4">
              {currentQuestion.media.type === "image" ? (
                <Image
                  src={currentQuestion.media.url}
                  alt="Média de la question"
                  width={400}
                  height={256}
                  className="max-w-full h-auto max-h-64 object-contain rounded"
                />
              ) : (
                <video
                  src={currentQuestion.media.url}
                  controls
                  className="max-w-full h-auto max-h-64 rounded"
                >
                  Votre navigateur ne supporte pas la lecture de vidéos.
                </video>
              )}
            </div>
          )}

          {currentQuestion.explanation && (
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded mb-4">
              <strong>Contexte :</strong> {currentQuestion.explanation}
            </div>
          )}
        </div>

        {/* Choix de réponses */}
        <div className="space-y-3">
          {currentQuestion.choices.map((choice) => (
            <button
              key={choice.index}
              onClick={() => setSelectedChoice(choice.index)}
              disabled={submitting || lastAnswerResult !== null}
              className={`w-full text-left p-4 border rounded-lg transition-all duration-200 ${
                selectedChoice === choice.index
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${
                submitting || lastAnswerResult !== null ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 ${
                  selectedChoice === choice.index 
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-gray-300'
                }`}>
                  {selectedChoice === choice.index && (
                    <div className="w-2 h-2 bg-white rounded-full m-auto"></div>
                  )}
                </div>
                <div className="flex-1">
                  <span className="block">{choice.text}</span>
                  {choice.media && (
                    <div className="mt-2">
                      {choice.media.type === "image" ? (
                        <Image
                          src={choice.media.url}
                          alt="Média du choix"
                          width={200}
                          height={96}
                          className="max-w-full h-auto max-h-24 object-contain rounded"
                        />
                      ) : (
                        <video
                          src={choice.media.url}
                          controls
                          className="max-w-full h-auto max-h-24 rounded"
                        >
                          Votre navigateur ne supporte pas la lecture de vidéos.
                        </video>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Bouton de soumission */}
        <div className="mt-6">
          <button
            onClick={submitAnswer}
            disabled={selectedChoice === null || submitting || lastAnswerResult !== null}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
              selectedChoice !== null && !submitting && lastAnswerResult === null
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {submitting ? 'Vérification...' : 'Valider ma réponse'}
          </button>
        </div>
      </div>
    </div>
  );
}


