import { describe, it, expect } from "vitest";
import {
  convertPrice,
  currencyFromLocale,
  formatPrice,
  getCurrency,
  isSupportedCurrency,
  PLAN_PRICES_USD,
} from "./pricing";

describe("convertPrice", () => {
  it("returns 0 for free plans in any currency", () => {
    expect(convertPrice(0, "USD")).toBe(0);
    expect(convertPrice(0, "INR")).toBe(0);
    expect(convertPrice(0, "AED")).toBe(0);
  });

  it("converts USD to INR with the configured rate", () => {
    expect(convertPrice(12, "INR")).toBe(998);
    expect(convertPrice(36, "INR")).toBe(2995);
  });

  it("keeps USD unchanged", () => {
    expect(convertPrice(12, "USD")).toBe(12);
    expect(convertPrice(36, "USD")).toBe(36);
  });

  it("rounds to whole units for other currencies", () => {
    expect(convertPrice(12, "EUR")).toBe(11);
    expect(convertPrice(12, "AED")).toBe(44);
  });

  it("falls back to USD for unknown codes", () => {
    expect(convertPrice(12, "XYZ")).toBe(12);
  });
});

describe("formatPrice", () => {
  it("renders 'Free' for zero amounts", () => {
    expect(formatPrice(0, "USD")).toBe("Free");
    expect(formatPrice(0, "INR")).toBe("Free");
  });

  it("formats with currency symbols", () => {
    expect(formatPrice(12, "USD")).toBe("$12");
    expect(formatPrice(12, "INR")).toBe("₹998");
  });
});

describe("currencyFromLocale", () => {
  it("maps Indian locales to INR", () => {
    expect(currencyFromLocale("en-IN")).toBe("INR");
    expect(currencyFromLocale("hi-IN")).toBe("INR");
    expect(currencyFromLocale("mr-IN")).toBe("INR");
  });

  it("maps European locales to EUR", () => {
    expect(currencyFromLocale("de-DE")).toBe("EUR");
    expect(currencyFromLocale("fr-FR")).toBe("EUR");
    expect(currencyFromLocale("it-IT")).toBe("EUR");
  });

  it("maps UK, UAE, Singapore, Australia, Canada specifically", () => {
    expect(currencyFromLocale("en-GB")).toBe("GBP");
    expect(currencyFromLocale("ar-AE")).toBe("AED");
    expect(currencyFromLocale("en-SG")).toBe("SGD");
    expect(currencyFromLocale("en-AU")).toBe("AUD");
    expect(currencyFromLocale("en-CA")).toBe("CAD");
  });

  it("defaults to USD", () => {
    expect(currencyFromLocale("en-US")).toBe("USD");
    expect(currencyFromLocale("xx-YY")).toBe("USD");
  });
});

describe("config integrity", () => {
  it("has a price entry for every subscription plan used in the app", () => {
    expect(PLAN_PRICES_USD.starter.monthly).toBe(0);
    expect(PLAN_PRICES_USD.pro.monthly).toBeGreaterThan(0);
    expect(PLAN_PRICES_USD.enterprise.monthly).toBeGreaterThan(
      PLAN_PRICES_USD.pro.monthly
    );
  });

  it("supports all currency codes exported", () => {
    for (const code of ["USD", "EUR", "GBP", "INR", "AED", "SGD", "CAD", "AUD"]) {
      expect(isSupportedCurrency(code)).toBe(true);
    }
    expect(isSupportedCurrency("JPY")).toBe(false);
  });

  it("getCurrency falls back to USD", () => {
    expect(getCurrency("JPY").code).toBe("USD");
  });
});
