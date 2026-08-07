// Central pricing configuration and multi-currency helpers.
//
// Base prices are anchored in USD and converted with approximate rates so the
// same plan is displayed (and billed via Stripe) in the visitor's currency.
// Rates are indicative only — point-of-sale amounts are always set by the
// Stripe Prices in the dashboard, never computed here.

export type CurrencyCode =
  | "USD"
  | "INR"
  | "EUR"
  | "GBP"
  | "AED"
  | "SGD"
  | "CAD"
  | "AUD";

export interface CurrencyInfo {
  code: CurrencyCode;
  /** ISO 4217 currency code, used for `Intl.NumberFormat` and Stripe. */
  currency: string;
  /** Approximate exchange rate vs. 1 USD. */
  rate: number;
  label: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", currency: "USD", rate: 1, label: "US Dollar (USD)" },
  { code: "EUR", currency: "EUR", rate: 0.92, label: "Euro (EUR)" },
  { code: "GBP", currency: "GBP", rate: 0.78, label: "British Pound (GBP)" },
  { code: "INR", currency: "INR", rate: 83.2, label: "Indian Rupee (INR)" },
  { code: "AED", currency: "AED", rate: 3.67, label: "UAE Dirham (AED)" },
  { code: "SGD", currency: "SGD", rate: 1.33, label: "Singapore Dollar (SGD)" },
  { code: "CAD", currency: "CAD", rate: 1.36, label: "Canadian Dollar (CAD)" },
  { code: "AUD", currency: "AUD", rate: 1.51, label: "Australian Dollar (AUD)" },
];

/** Plan prices, in USD, for the SaaS interview product. */
export const PLAN_PRICES_USD: Record<string, { monthly: number }> = {
  starter: { monthly: 0 },
  pro: { monthly: 12 },
  enterprise: { monthly: 36 },
};

/** One-time/verification-credit prices (enterprise screening plans), in USD. */
export const VERIFICATION_PRICES_USD: Record<string, { monthly: number }> = {
  startup: { monthly: 120 },
  business: { monthly: 600 },
};

export function getCurrency(code: string): CurrencyInfo {
  const match = CURRENCIES.find((c) => c.code === code);
  return match || CURRENCIES[0];
}

export function isSupportedCurrency(code: string): code is CurrencyCode {
  return CURRENCIES.some((c) => c.code === code);
}

/** Convert a USD amount to a rounded amount in the given currency. */
export function convertPrice(usd: number, currencyCode: string): number {
  const { rate } = getCurrency(currencyCode);
  const converted = usd * rate;
  if (usd === 0) return 0;
  // INR gets no fractional subunit display but still rounds to whole units.
  return Math.round(converted);
}

/**
 * Format a USD-anchored price in the target currency.
 * Returns "Free" for zero amounts (used for the Starter plan).
 */
export function formatPrice(usd: number, currencyCode: string, locale = "en"): string {
  const amount = convertPrice(usd, currencyCode);
  if (amount === 0) return "Free";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const LOCALE_CURRENCY: Record<string, CurrencyCode> = {
  "en-IN": "INR",
  "hi-IN": "INR",
  "mr-IN": "INR",
  "ta-IN": "INR",
  "te-IN": "INR",
  "bn-IN": "INR",
  "gu-IN": "INR",
  "kn-IN": "INR",
  "ml-IN": "INR",
  "pa-IN": "INR",
  "en-GB": "GBP",
  "en-AU": "AUD",
  "en-NZ": "AUD",
  "en-CA": "CAD",
  "fr-CA": "CAD",
  "ar-AE": "AED",
  "en-AE": "AED",
  "en-SG": "SGD",
  "zh-SG": "SGD",
  "de-DE": "EUR",
  "de-AT": "EUR",
  "fr-FR": "EUR",
  "fr-BE": "EUR",
  "fr-CH": "EUR",
  "es-ES": "EUR",
  "it-IT": "EUR",
  "nl-NL": "EUR",
  "pt-PT": "EUR",
  "en-IE": "EUR",
  "en-DE": "EUR",
};

/** Guess a currency from a browser language tag (e.g. "en-IN"). */
export function currencyFromLocale(locale: string): CurrencyCode {
  if (LOCALE_CURRENCY[locale]) return LOCALE_CURRENCY[locale];
  const base = locale.split("-")[0];
  switch (base) {
    case "hi":
    case "mr":
    case "ta":
    case "te":
    case "bn":
    case "gu":
    case "kn":
    case "ml":
    case "pa":
    case "ur":
      return "INR";
    case "de":
    case "fr":
    case "es":
    case "it":
    case "nl":
    case "pt":
    case "sv":
    case "no":
    case "da":
    case "fi":
    case "pl":
      return "EUR";
    case "ar":
      return "AED";
    case "zh":
      return "SGD";
    default:
      return "USD";
  }
}

export const CURRENCY_STORAGE_KEY = "tcCurrency";
