"use client";
import { useEffect, useState } from "react";

type ProgressStats = {
  global: {
    totalProgressions: number;
    completedProgressions: number;
    failedProgressions: number;
    activeProgressions: number;
    completionRate: number;
    failureRate: number;
  };
  byQuiz: Array<{
    _id: string;
    quizTitle: string;
    totalAttempts: number;
    completedAttempts: number;
    failedAttempts: number;
    activeAttempts: number;
    avgLivesRemaining: number;
    avgCorrectAnswers: number;
  }>;
  byUser: Array<{
    _id: string;
    userName: string;
    userEmail: string;
    totalAttempts: number;
    completedAttempts: number;
    failedAttempts: number;
    activeAttempts: number;
    avgLivesRemaining: number;
    avgCorrectAnswers: number;
  }>;
  recent: Array<{
    quizTitle: string;
    userName: string;
    userEmail: string;
    lives: number;
    currentQuestionIndex: number;
    isCompleted: boolean;
    isFailed: boolean;
    correctAnswers: number;
    totalAnswers: number;
    lastActivityAt: string;
  }>;
};

export default function ProgressStats() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/stats/progress");
      const data = await res.json();
      
      if (!res.ok) throw new Error(data?.error || "Erreur");
      
      setStats(data.stats);
    } catch (e: unknown) {
      setError((e as Error).message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-600">{error}</p>
    </div>
  );

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total des progressions</h3>
          <p className="text-2xl font-bold">{stats.global.totalProgressions}</p>
        </div>
        
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Quiz terminés</h3>
          <p className="text-2xl font-bold text-green-600">{stats.global.completedProgressions}</p>
          <p className="text-sm text-gray-500">{stats.global.completionRate}% de réussite</p>
        </div>
        
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Quiz échoués</h3>
          <p className="text-2xl font-bold text-red-600">{stats.global.failedProgressions}</p>
          <p className="text-sm text-gray-500">{stats.global.failureRate}% d&apos;échec</p>
        </div>
        
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">En cours</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.global.activeProgressions}</p>
        </div>
      </div>

      {/* Statistiques par quiz */}
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Statistiques par quiz</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Quiz</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tentatives</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Terminés</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Échoués</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">En cours</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Vies moy.</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Score moy.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.byQuiz.map((quiz) => (
                <tr key={quiz._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{quiz.quizTitle}</td>
                  <td className="px-4 py-3 text-sm">{quiz.totalAttempts}</td>
                  <td className="px-4 py-3 text-sm text-green-600">{quiz.completedAttempts}</td>
                  <td className="px-4 py-3 text-sm text-red-600">{quiz.failedAttempts}</td>
                  <td className="px-4 py-3 text-sm text-blue-600">{quiz.activeAttempts}</td>
                  <td className="px-4 py-3 text-sm">{quiz.avgLivesRemaining.toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm">{quiz.avgCorrectAnswers.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistiques par utilisateur */}
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Statistiques par utilisateur</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Utilisateur</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tentatives</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Terminés</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Échoués</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">En cours</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Vies moy.</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Score moy.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.byUser.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{user.userName}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{user.userEmail}</td>
                  <td className="px-4 py-3 text-sm">{user.totalAttempts}</td>
                  <td className="px-4 py-3 text-sm text-green-600">{user.completedAttempts}</td>
                  <td className="px-4 py-3 text-sm text-red-600">{user.failedAttempts}</td>
                  <td className="px-4 py-3 text-sm text-blue-600">{user.activeAttempts}</td>
                  <td className="px-4 py-3 text-sm">{user.avgLivesRemaining.toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm">{user.avgCorrectAnswers.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activité récente */}
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Activité récente</h2>
        </div>
        <div className="p-4 space-y-3">
          {stats.recent.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{activity.userName}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600">{activity.quizTitle}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Question {activity.currentQuestionIndex + 1} • {activity.lives} vies restantes
                  {activity.correctAnswers > 0 && (
                    <span> • {activity.correctAnswers}/{activity.totalAnswers} correctes</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {activity.isCompleted && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Terminé
                  </span>
                )}
                {activity.isFailed && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                    Échoué
                  </span>
                )}
                {!activity.isCompleted && !activity.isFailed && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    En cours
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {new Date(activity.lastActivityAt).toLocaleString('fr-FR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
