"use client";

import { useCurrency } from "@/lib/useCurrency";
import type { CurrencyCode } from "@/lib/pricing";

export default function CurrencySelector({ className = "" }: { className?: string }) {
  const { currency, setCurrency, currencies } = useCurrency();

  return (
    <label className={`inline-flex items-center gap-2 ${className}`}>
      <span className="text-xs font-medium text-slate-400">Currency</span>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
        className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Preferred currency"
      >
        {currencies.map((c) => (
          <option key={c.code} value={c.code} className="text-slate-900">
            {c.label}
          </option>
        ))}
      </select>
    </label>
  );
}
