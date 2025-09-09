"use client";
import { useEffect, useState } from "react";

interface Badge {
  _id: string;
  title: string;
  description?: string;
  isActive: boolean;
}

export default function BadgesPage() {
  const [items, setItems] = useState<Badge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/badges");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Erreur");
        setItems((data.badges || []).filter((b: Badge) => b.isActive));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Badges</h1>
      {loading ? <p>Chargement...</p> : error ? <p className="text-red-600">{error}</p> : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <li key={b._id} className="border rounded p-4">
              <div className="font-semibold">{b.title}</div>
              {b.description && <div className="text-sm opacity-80">{b.description}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


