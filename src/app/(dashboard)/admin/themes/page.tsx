"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface RawTheme {
  _id: string;
  name: string;
  slug: string;
  isActive?: boolean;
}

type Theme = { id: string; name: string; slug: string; isActive?: boolean };

export default function AdminThemesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "admin") {
      router.replace("/connexion");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/admin/themes");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Erreur");
        const list: Theme[] = (data.themes || []).map((t: RawTheme) => ({ id: String(t._id), name: t.name, slug: t.slug, isActive: t.isActive }));
        setThemes(list);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, [status, session, router]);

  async function createTheme(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      setName("");
      setSlug("");
      setIsActive(true);
      // recharge la liste
      const resList = await fetch("/api/admin/themes");
      const dataList = await resList.json();
      const list: Theme[] = (dataList.themes || []).map((t: RawTheme) => ({ id: String(t._id), name: t.name, slug: t.slug, isActive: t.isActive }));
      setThemes(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Thématiques (Admin)</h1>
      </div>

      <form onSubmit={createTheme} className="grid gap-4 max-w-xl rounded-xl border border-black/[.08] bg-white p-4">
        <div className="grid gap-1">
          <label className="text-sm">Nom</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="border rounded px-3 py-2" placeholder="Ex: Audit énergétique" required />
        </div>
        <div className="grid gap-1">
          <label className="text-sm">Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} onBlur={() => {
            if (!slug && name) {
              setSlug(name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
            }
          }} className="border rounded px-3 py-2" placeholder="ex: audit-energetique" required />
        </div>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <span>Actif</span>
        </label>
        <button type="submit" disabled={saving} className="inline-flex items-center rounded-lg bg-blue-600 text-white px-5 py-2 disabled:opacity-50 hover:bg-blue-700">{saving ? "Enregistrement..." : "Créer"}</button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>

      {loading ? <p>Chargement...</p> : (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Liste des thématiques</h2>
          <ul className="space-y-2">
            {themes.map((t) => (
              <li key={t.id} className="rounded-xl border border-black/[.08] bg-white p-3 flex items-center justify-between gap-4 hover:shadow-sm transition">
                <div className="flex-1">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm text-black/60">{t.slug} {t.isActive ? "(actif)" : "(inactif)"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={async () => {
                    const newName = prompt('Nouveau nom', t.name) || t.name;
                    const newSlug = prompt('Nouveau slug', t.slug) || t.slug;
                    const newActive = confirm('Activer la thématique ? OK=Activer / Annuler=Inactiver') ? true : false;
                    try {
                      const res = await fetch(`/api/admin/themes/${t.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName, slug: newSlug, isActive: newActive }) });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data?.error || 'Erreur');
                      const resList = await fetch('/api/admin/themes');
                      const dataList = await resList.json();
                      setThemes((dataList.themes || []).map((x: RawTheme) => ({ id: String(x._id), name: x.name, slug: x.slug, isActive: x.isActive })));
                    } catch (e) {
                      alert(e instanceof Error ? e.message : 'Erreur');
                    }
                  }} className="text-sm rounded-md border px-3 py-1 hover:bg-black/[.03]">Éditer</button>
                  <button onClick={async () => {
                    if (!confirm('Supprimer cette thématique ?')) return;
                    try {
                      const res = await fetch(`/api/admin/themes/${t.id}`, { method: 'DELETE' });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data?.error || 'Erreur');
                      setThemes((prev) => prev.filter((x) => x.id !== t.id));
                    } catch (e) {
                      alert(e instanceof Error ? e.message : 'Erreur');
                    }
                  }} className="text-sm rounded-md border px-3 py-1 hover:bg-black/[.03]">Supprimer</button>
                </div>
              </li>
            ))}
            {themes.length === 0 && <li className="text-sm text-black/60">Aucune thématique pour le moment.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}


