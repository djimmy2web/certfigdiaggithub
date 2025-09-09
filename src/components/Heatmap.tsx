"use client";
import { useMemo } from "react";

type DayEntry = { day: string | Date; attempts: number };

export default function Heatmap({ attempts }: { attempts: DayEntry[] }) {
  const days = useMemo(() => attempts.map((d) => ({ date: new Date(d.day), attempts: d.attempts })), [attempts]);
  const max = useMemo(() => days.reduce((m, d) => Math.max(m, d.attempts), 0), [days]);
  const scale = (v: number) => (max === 0 ? 0 : Math.ceil((v / max) * 4)); // 0..4

  return (
    <div className="space-y-3">
      <div className="text-lg font-semibold">Activité (heatmap)</div>
      <div className="grid grid-cols-14 gap-1">
        {days.map((d, i) => (
          <div key={i} title={`${d.date.toLocaleDateString()} — ${d.attempts} tentatives`} className={`h-6 w-6 rounded ${
            ["bg-black/[.06] dark:bg-white/[.08]","bg-green-200","bg-green-300","bg-green-400","bg-green-600"][scale(d.attempts)]
          }`} />
        ))}
      </div>
    </div>
  );
}


