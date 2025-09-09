"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProgressStats from "@/components/ProgressStats";
import WeeklyCharts from "@/components/WeeklyCharts";

interface Choice {
  media?: unknown;
  explanation?: string;
}

interface Question {
  media?: unknown;
  explanation?: string;
  choices?: Choice[];
}

interface Quiz {
  isPublished: boolean;
  difficulty?: "debutant" | "intermediaire" | "expert";
  questions?: Question[];
}

type QuizStats = {
  total: number;
  published: number;
  draft: number;
  withMedia: number;
  withExplanations: number;
  byDifficulty: {
    debutant: number;
    intermediaire: number;
    expert: number;
  };
  averageQuestions: number;
  totalQuestions: number;
  totalChoices: number;
};

type AttemptStats = {
  total: number;
  averageScore: number;
  totalUsers: number;
  recentAttempts: number;
};

export default function AdminStatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [attemptStats, setAttemptStats] = useState<AttemptStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "admin") {
      router.replace("/connexion");
      return;
    }
    
    (async () => {
      try {
        const [quizzesRes, attemptsRes] = await Promise.all([
          fetch("/api/admin/quizzes"),
          fetch("/api/admin/stats/attempts")
        ]);
        
        const quizzesData = await quizzesRes.json();
        if (!quizzesRes.ok) throw new Error(quizzesData?.error || "Erreur");
        
        const attemptsData = await attemptsRes.json();
        if (!attemptsRes.ok) throw new Error(attemptsData?.error || "Erreur");
        
        // Calculer les statistiques des quiz
        const quizzes = quizzesData.quizzes || [];
        const total = quizzes.length;
        const published = quizzes.filter((q: Quiz) => q.isPublished).length;
        const draft = total - published;
        
        let withMedia = 0;
        let withExplanations = 0;
        let totalQuestions = 0;
        let totalChoices = 0;
        const difficultyCount = { debutant: 0, intermediaire: 0, expert: 0 };
        
        quizzes.forEach((quiz: Quiz) => {
          const questions = quiz.questions || [];
          totalQuestions += questions.length;
          
          questions.forEach((question: Question) => {
            if (question.media) withMedia++;
            if (question.explanation) withExplanations++;
            
            const choices = question.choices || [];
            totalChoices += choices.length;
            
            choices.forEach((choice: Choice) => {
              if (choice.media) withMedia++;
              if (choice.explanation) withExplanations++;
            });
          });
          
          const difficulty = quiz.difficulty || "debutant";
          difficultyCount[difficulty as keyof typeof difficultyCount]++;
        });
        
        setQuizStats({
          total,
          published,
          draft,
          withMedia,
          withExplanations,
          byDifficulty: difficultyCount,
          averageQuestions: total > 0 ? Math.round(totalQuestions / total * 10) / 10 : 0,
          totalQuestions,
          totalChoices,
        });
        
        setAttemptStats(attemptsData);
        
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, [status, session, router]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Chargement des statistiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Statistiques</h1>
        <div className="text-sm text-gray-500">
          Dernière mise à jour : {new Date().toLocaleString("fr-FR")}
        </div>
      </div>

      {/* Statistiques des Quiz */}
      {quizStats && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Quiz</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-blue-600">{quizStats.total}</div>
                  <div className="text-sm text-gray-600">Total quiz</div>
                </div>
                <div className="text-2xl">📚</div>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-green-600">{quizStats.published}</div>
                  <div className="text-sm text-gray-600">Publiés</div>
                </div>
                <div className="text-2xl">✅</div>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-gray-600">{quizStats.draft}</div>
                  <div className="text-sm text-gray-600">Brouillons</div>
                </div>
                <div className="text-2xl">📝</div>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-purple-600">{quizStats.totalQuestions}</div>
                  <div className="text-sm text-gray-600">Questions totales</div>
                </div>
                <div className="text-2xl">❓</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fonctionnalités */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Fonctionnalités utilisées</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Quiz avec médias</span>
                  <span className="font-semibold text-blue-600">{quizStats.withMedia}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Quiz avec explications</span>
                  <span className="font-semibold text-purple-600">{quizStats.withExplanations}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Moyenne questions/quiz</span>
                  <span className="font-semibold text-green-600">{quizStats.averageQuestions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total choix</span>
                  <span className="font-semibold text-orange-600">{quizStats.totalChoices}</span>
                </div>
              </div>
            </div>

            {/* Répartition par niveau */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Répartition par niveau</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Débutant</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(quizStats.byDifficulty.debutant / quizStats.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold text-green-600">{quizStats.byDifficulty.debutant}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Intermédiaire</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${(quizStats.byDifficulty.intermediaire / quizStats.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold text-yellow-600">{quizStats.byDifficulty.intermediaire}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Expert</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${(quizStats.byDifficulty.expert / quizStats.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold text-red-600">{quizStats.byDifficulty.expert}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques des Tentatives */}
      {attemptStats && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Tentatives</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-blue-600">{attemptStats.total}</div>
                  <div className="text-sm text-gray-600">Total tentatives</div>
                </div>
                <div className="text-2xl">🎯</div>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-green-600">{attemptStats.totalUsers}</div>
                  <div className="text-sm text-gray-600">Utilisateurs actifs</div>
                </div>
                <div className="text-2xl">👥</div>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-purple-600">{attemptStats.averageScore}%</div>
                  <div className="text-sm text-gray-600">Score moyen</div>
                </div>
                <div className="text-2xl">📊</div>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-orange-600">{attemptStats.recentAttempts}</div>
                  <div className="text-sm text-gray-600">Tentatives récentes</div>
                </div>
                <div className="text-2xl">🕒</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques de Progression */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Progression avec système de vies</h2>
        <ProgressStats />
      </div>

      {/* Graphiques Hebdomadaires */}
      <div className="space-y-6">
        <WeeklyCharts />
      </div>
    </div>
  );
}
