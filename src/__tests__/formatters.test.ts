import { describe, it, expect } from "vitest";
import {
  formatEcoTokens,
  formatFiatPEN,
  formatRegionalDate,
  isValidCorrelative,
} from "@/lib/formatters";

describe("Formatters Unit Tests", () => {
  describe("formatEcoTokens", () => {
    it("formatea números enteros y decimales correctamente", () => {
      expect(formatEcoTokens(15)).toBe("15.00 ECO");
      expect(formatEcoTokens(23.456)).toBe("23.46 ECO");
      expect(formatEcoTokens("10.5")).toBe("10.50 ECO");
    });

    it("maneja valores nulos o no numéricos de forma defensiva", () => {
      expect(formatEcoTokens(null)).toBe("0.00 ECO");
      expect(formatEcoTokens(undefined)).toBe("0.00 ECO");
      expect(formatEcoTokens("abc")).toBe("0.00 ECO");
    });
  });

  describe("formatFiatPEN", () => {
    it("convierte EcoTokens a Soles con la tasa por defecto (3.75)", () => {
      expect(formatFiatPEN(10)).toBe("S/ 37.50 PEN");
      expect(formatFiatPEN("20")).toBe("S/ 75.00 PEN");
    });

    it("permite tasas de cambio personalizadas", () => {
      expect(formatFiatPEN(10, 1.0)).toBe("S/ 10.00 PEN");
    });
  });

  describe("formatRegionalDate", () => {
    it("formatea fechas ISO a formato regional", () => {
      const formatted = formatRegionalDate("2026-08-31T12:00:00Z");
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it("maneja fechas inválidas o vacías", () => {
      expect(formatRegionalDate("")).toBe("---");
      expect(formatRegionalDate("invalid-date")).toBe("Fecha inválida");
    });
  });

  describe("isValidCorrelative", () => {
    it("valida correctamente el patrón XXXXX-AAAA", () => {
      expect(isValidCorrelative("00001-2026")).toBe(true);
      expect(isValidCorrelative("12345-2025")).toBe(true);
      expect(isValidCorrelative("123-2026")).toBe(false);
      expect(isValidCorrelative("00001-26")).toBe(false);
      expect(isValidCorrelative("ABCDE-2026")).toBe(false);
    });
  });
});
