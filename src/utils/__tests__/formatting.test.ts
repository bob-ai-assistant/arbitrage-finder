import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatMargin,
  formatConfidence,
  formatScore,
} from "../formatting.js";

describe("Formatting utilities", () => {
  describe("formatCurrency", () => {
    it("should format SEK amounts with 'kr' suffix", () => {
      const result = formatCurrency(1500, "SEK");
      expect(result).toContain("kr");
      // Rounds to whole number for SEK
      expect(result).toContain("1");
    });

    it("should format USD with $ prefix", () => {
      const result = formatCurrency(29.99, "USD");
      expect(result).toBe("$29.99");
    });

    it("should format EUR with € prefix", () => {
      const result = formatCurrency(19.5, "EUR");
      expect(result).toBe("€19.50");
    });

    it("should default to SEK when no currency specified", () => {
      const result = formatCurrency(500);
      expect(result).toContain("kr");
    });

    it("should handle unknown currencies", () => {
      const result = formatCurrency(100, "GBP");
      expect(result).toContain("GBP");
      expect(result).toContain("100.00");
    });
  });

  describe("formatMargin", () => {
    it("should include the percentage sign", () => {
      const result = formatMargin(25);
      expect(result).toContain("+25.0%");
    });

    it("should handle decimal margins", () => {
      const result = formatMargin(15.7);
      expect(result).toContain("+15.7%");
    });
  });

  describe("formatConfidence", () => {
    it("should convert decimal to percentage", () => {
      const result = formatConfidence(0.85);
      expect(result).toContain("85%");
    });

    it("should handle low confidence", () => {
      const result = formatConfidence(0.3);
      expect(result).toContain("30%");
    });
  });

  describe("formatScore", () => {
    it("should show star rating and numeric score", () => {
      const result = formatScore(80);
      expect(result).toContain("★");
      expect(result).toContain("80");
    });

    it("should cap stars at 5", () => {
      const result = formatScore(100);
      expect(result).toContain("★★★★★");
      expect(result).not.toContain("☆");
    });

    it("should show empty stars for low scores", () => {
      const result = formatScore(20);
      expect(result).toContain("☆");
    });
  });
});
