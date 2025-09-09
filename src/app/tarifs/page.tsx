"use client";
import { useState } from "react";

function PlanCard({ title, price, features, action }: { title: string; price: string; features: string[]; action: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-6 space-y-4">
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-3xl font-bold">{price}</div>
      <ul className="text-sm space-y-1">
        {features.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>
      {action}
    </div>
  );
}

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function go(plan: "free" | "pro" | "premium") {
    setLoading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur paiement");
      if (plan === "free") {
        location.href = "/";
      } else if (data.url) {
        location.href = data.url;
      }
    } catch (e: unknown) {
      alert((e as Error).message || "Erreur");
    } finally {
      setLoading(null);
    }
  }

  async function openPortal() {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (res.ok && data.url) location.href = data.url;
  }

  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-semibold">Tarifs</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <PlanCard
          title="Free"
          price="0€"
          features={["Accès limité", "Quiz publics", "Badges basiques"]}
          action={<button onClick={() => go("free")} className="bg-black text-white rounded px-4 py-2">Choisir</button>}
        />
        <PlanCard
          title="Pro"
          price="9,99€ / mois"
          features={["Accès complet", "Statistiques avancées", "Priorité"]}
          action={<button disabled={loading==="pro"} onClick={() => go("pro")} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">{loading==="pro"?"Redirection...":"S'abonner"}</button>}
        />
        <PlanCard
          title="Premium"
          price="19,99€ / mois"
          features={["Tout Pro", "Contenu exclusif", "Support dédié"]}
          action={<button disabled={loading==="premium"} onClick={() => go("premium")} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">{loading==="premium"?"Redirection...":"S'abonner"}</button>}
        />
      </div>

      <div>
        <button onClick={openPortal} className="underline text-sm">Gérer mon abonnement</button>
      </div>
    </section>
  );
}


