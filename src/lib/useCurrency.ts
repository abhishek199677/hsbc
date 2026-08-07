"use client";

import { useCallback, useState } from "react";
import {
  CURRENCY_STORAGE_KEY,
  CURRENCIES,
  currencyFromLocale,
  type CurrencyCode,
} from "@/lib/pricing";

function detectCurrency(): CurrencyCode {
  if (typeof window === "undefined") return "USD";
  try {
    const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored && CURRENCIES.some((c) => c.code === stored)) {
      return stored as CurrencyCode;
    }
  } catch {}
  const locale = (typeof navigator !== "undefined" && navigator.language) || "en-US";
  return currencyFromLocale(locale);
}

export function useCurrency() {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => detectCurrency());

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    try {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, code);
    } catch {}
  }, []);

  return { currency, setCurrency, currencies: CURRENCIES };
}
