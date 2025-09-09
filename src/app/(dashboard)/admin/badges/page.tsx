"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Badge {
  _id: string;
  title: string;
  description?: string;
  criteria?: {
    minScore?: number;
    quizId?: string;
  };
}

export default function AdminBadgesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<Badge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "admin") {
      router.replace("/connexion");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/admin/badges");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Erreur");
        setItems(data.badges || []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, [status, session, router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Badges (Admin)</h1>
        <a href="/admin/badges/new" className="bg-black text-white rounded px-3 py-2 text-sm">Nouveau badge</a>
      </div>
      {loading ? <p>Chargement...</p> : error ? <p className="text-red-600">{error}</p> : (
        <ul className="space-y-2">
          {items.map((b) => (
            <li key={b._id} className="border rounded p-3">
              <div className="font-semibold">{b.title}</div>
              {b.description && <div className="text-sm opacity-80">{b.description}</div>}
              {b.criteria?.minScore != null && (
                <div className="text-xs mt-1">Critère: score ≥ {b.criteria.minScore}{b.criteria?.quizId ? " (quiz ciblé)" : ""}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


