"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function NewBadgePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [minScore, setMinScore] = useState<number | "">(0);
  const [quizId, setQuizId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "admin") {
      router.replace("/connexion");
    }
  }, [status, session, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, isActive, criteria: { minScore: minScore === "" ? undefined : Number(minScore), quizId: quizId || undefined } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      router.replace("/admin/badges");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nouveau badge</h1>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-4">
          <label className="block">
            <div className="text-sm mb-1">Titre</div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Description</div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded px-3 py-2" />
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span>Actif</span>
          </label>
        </div>

        <div className="space-y-3">
          <div className="font-medium">Critères</div>
          <label className="block">
            <div className="text-sm mb-1">Score minimal (optionnel)</div>
            <input type="number" min={0} value={minScore} onChange={(e) => setMinScore(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border rounded px-3 py-2" />
          </label>
          <label className="block">
            <div className="text-sm mb-1">ID du quizz ciblé (optionnel)</div>
            <input value={quizId} onChange={(e) => setQuizId(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Laisser vide pour s'appliquer à tous" />
          </label>
        </div>

        {error && <p className="text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}


