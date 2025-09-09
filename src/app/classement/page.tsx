"use client";
import { useEffect, useState } from "react";

type Row = {
  rank: number;
  name: string;
  email: string | null;
  totalScore: number;
  attempts: number;
  lastAttemptAt: string;
};

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/leaderboard?limit=50");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Erreur");
        setRows(data.leaderboard || []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Classement</h1>
      {loading ? <p>Chargement...</p> : error ? <p className="text-red-600">{error}</p> : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-black/[.03]">
              <tr>
                <th className="px-3 py-2 text-left border-r">#</th>
                <th className="px-3 py-2 text-left border-r">Utilisateur</th>
                <th className="px-3 py-2 text-left border-r">Score total</th>
                <th className="px-3 py-2 text-left border-r">Tentatives</th>
                <th className="px-3 py-2 text-left">Dernière tentative</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.rank} className="border-t">
                  <td className="px-3 py-2 border-r">{r.rank}</td>
                  <td className="px-3 py-2 border-r">{r.name}</td>
                  <td className="px-3 py-2 border-r">{r.totalScore}</td>
                  <td className="px-3 py-2 border-r">{r.attempts}</td>
                  <td className="px-3 py-2">{new Date(r.lastAttemptAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


