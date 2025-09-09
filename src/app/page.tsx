"use client";
import { useEffect, useState } from "react";
import PersonalWeeklyCharts from "@/components/PersonalWeeklyCharts";
import StreakTracker from "@/components/StreakTracker";

type Theme = { id: string; name: string; slug: string };
type QuizCard = { id: string; title: string; description?: string };
type Leader = { rank: number; name: string; totalScore: number };

export default function Home() {
  const [resumeQuiz, setResumeQuiz] = useState<QuizCard | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [stats, setStats] = useState<{ streak: number; points: number } | null>(null);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [themesRes, leadersRes] = await Promise.all([
          fetch("/api/themes"),
          fetch("/api/leaderboard?limit=5"),
        ]);
        const themesData = await themesRes.json();
        const leadersData = await leadersRes.json();
        setThemes(themesData.themes || []);
        setLeaders(leadersData.leaderboard || []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur");
      }
    })();
  }, []);

  useEffect(() => {
    // Récupérer le quiz en cours via API (si connecté)
    (async () => {
      try {
        const res = await fetch("/api/me/progress");
        if (!res.ok) return; // non connecté
        const data = await res.json();
        if (data?.progress) setResumeQuiz({ id: data.progress.quizId, title: data.progress.title, description: data.progress.description });
      } catch {}
    })();
  }, []);

  useEffect(() => {
    // Stats personnelles de base: streak + points (totalScore)
    (async () => {
      try {
        const res = await fetch("/api/stats/me");
        if (!res.ok) return; // utilisateur non connecté
        const data = await res.json();
        setStats({ streak: data?.totals?.streak || 0, points: data?.totals?.totalScore || 0 });
      } catch {}
    })();
  }, []);

  return (
    <section className="space-y-10">
      <h1 className="text-2xl font-semibold">C&apos;est un plaisir de vous revoir</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          {resumeQuiz && (
            <div className="border rounded-xl p-6 bg-blue-500 text-white flex items-center justify-between">
              <div className="text-lg font-semibold truncate">{resumeQuiz.title}</div>
              <a href={`/reviser/${resumeQuiz.id}`} className="bg-white text-blue-600 rounded px-4 py-2 text-sm font-medium">Reprendre</a>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Nos thématiques</h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {themes.map((t) => (
                <li key={t.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="font-medium">{t.name}</div>
                  <a href={`/reviser?theme=${encodeURIComponent(t.slug)}`} className="text-sm underline">Voir les quizz</a>
                </li>
              ))}
              {themes.length === 0 && <li className="text-sm text-black/60">Aucune thématique disponible</li>}
            </ul>
          </div>
        </div>

        <aside className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 text-center">
              <div className="text-sm text-black/70">Jour de suite</div>
              <div className="text-2xl font-semibold">{stats?.streak ?? 0}</div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-sm text-black/70">Points</div>
              <div className="text-2xl font-semibold">{stats?.points ?? 0}</div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Top élèves du mois</h3>
            <ul className="space-y-2">
              {leaders.map((l) => (
                <li key={l.rank} className="border rounded p-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-semibold">{l.rank}</span>
                    <span>{l.name}</span>
                  </div>
                  <span className="font-medium">{l.totalScore}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Graphiques personnels pour les utilisateurs connectés */}
      {stats && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">📊 Mon Activité Hebdomadaire</h2>
          <PersonalWeeklyCharts />
        </div>
      )}

      {/* Tableau de série pour les utilisateurs connectés */}
      {stats && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">🔥 Ma Série</h2>
          <StreakTracker />
        </div>
      )}
    </section>
  );
}
