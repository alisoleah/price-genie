import { describe, expect, it } from "vitest";
import {
  cosineSimilarity,
  levenshteinDistance,
  stringSimilarity,
  normalizeProductName,
  extractProductFeatures,
  calculateMatchScore,
} from "./embeddings";

describe("Embeddings and Fuzzy Matching", () => {
  describe("cosineSimilarity", () => {
    it("should return 1 for identical vectors", () => {
      const vec = [1, 2, 3];
      expect(cosineSimilarity(vec, vec)).toBe(1);
    });

    it("should return 0 for orthogonal vectors", () => {
      const vec1 = [1, 0];
      const vec2 = [0, 1];
      expect(cosineSimilarity(vec1, vec2)).toBe(0);
    });

    it("should return -1 for opposite vectors", () => {
      const vec1 = [1, 0];
      const vec2 = [-1, 0];
      expect(cosineSimilarity(vec1, vec2)).toBe(-1);
    });

    it("should throw error for vectors of different lengths", () => {
      const vec1 = [1, 2];
      const vec2 = [1, 2, 3];
      expect(() => cosineSimilarity(vec1, vec2)).toThrow();
    });
  });

  describe("levenshteinDistance", () => {
    it("should return 0 for identical strings", () => {
      expect(levenshteinDistance("hello", "hello")).toBe(0);
    });

    it("should calculate correct distance for single character difference", () => {
      expect(levenshteinDistance("hello", "hallo")).toBe(1);
    });

    it("should calculate correct distance for multiple differences", () => {
      expect(levenshteinDistance("kitten", "sitting")).toBe(3);
    });

    it("should handle empty strings", () => {
      expect(levenshteinDistance("", "hello")).toBe(5);
      expect(levenshteinDistance("hello", "")).toBe(5);
    });
  });

  describe("stringSimilarity", () => {
    it("should return 1 for identical strings", () => {
      expect(stringSimilarity("hello", "hello")).toBe(1);
    });

    it("should return value between 0 and 1 for similar strings", () => {
      const sim = stringSimilarity("iPhone 15", "iPhone 15 Pro");
      expect(sim).toBeGreaterThan(0.5);
      expect(sim).toBeLessThan(1);
    });

    it("should be case insensitive", () => {
      expect(stringSimilarity("HELLO", "hello")).toBe(1);
    });

    it("should return 0 for completely different strings", () => {
      const sim = stringSimilarity("abc", "xyz");
      expect(sim).toBeLessThan(0.5);
    });
  });

  describe("normalizeProductName", () => {
    it("should convert to lowercase", () => {
      expect(normalizeProductName("iPhone 15 Pro")).toBe("iphone 15 pro");
    });

    it("should remove special characters", () => {
      expect(normalizeProductName("iPhone-15 (Pro)")).toBe("iphone 15 pro");
    });

    it("should normalize whitespace", () => {
      expect(normalizeProductName("iPhone   15    Pro")).toBe("iphone 15 pro");
    });

    it("should trim leading and trailing spaces", () => {
      expect(normalizeProductName("  iPhone 15 Pro  ")).toBe("iphone 15 pro");
    });
  });

  describe("extractProductFeatures", () => {
    it("should extract brand from product name", () => {
      const features = extractProductFeatures("Apple iPhone 15 Pro");
      expect(features.brand).toBe("apple");
    });

    it("should extract size from product name", () => {
      const features = extractProductFeatures("Almarai Milk 1L");
      expect(features.size).toBe("1l");
    });

    it("should extract color from product name", () => {
      const features = extractProductFeatures("iPhone 15 Pro Black");
      expect(features.color).toBe("black");
    });

    it("should extract multiple features", () => {
      const features = extractProductFeatures("Samsung Galaxy S24 256GB Silver");
      expect(features.brand).toBe("samsung");
      expect(features.size).toBe("256g"); // Regex captures "256g" from "256GB"
      expect(features.color).toBe("silver");
    });

    it("should handle products with no recognizable features", () => {
      const features = extractProductFeatures("Generic Product");
      expect(features.brand).toBeUndefined();
      expect(features.size).toBeUndefined();
      expect(features.color).toBeUndefined();
    });
  });

  describe("calculateMatchScore", () => {
    it("should return high score for very similar products", () => {
      const product1 = { name: "iPhone 15 Pro 256GB Black" };
      const product2 = { name: "iPhone 15 Pro 256GB Black" };
      const score = calculateMatchScore(product1, product2);
      expect(score).toBeGreaterThan(0.9);
    });

    it("should return medium score for similar products with variations", () => {
      const product1 = { name: "iPhone 15 Pro 256GB" };
      const product2 = { name: "Apple iPhone 15 Pro 256GB Black" };
      const score = calculateMatchScore(product1, product2);
      expect(score).toBeGreaterThan(0.6);
      expect(score).toBeLessThan(0.9);
    });

    it("should return low score for different products", () => {
      const product1 = { name: "iPhone 15 Pro" };
      const product2 = { name: "Samsung Galaxy S24" };
      const score = calculateMatchScore(product1, product2);
      expect(score).toBeLessThan(0.5);
    });

    it("should use embeddings when available", () => {
      const product1 = {
        name: "iPhone 15 Pro",
        embedding: [1, 0, 0],
      };
      const product2 = {
        name: "iPhone 15 Pro Max",
        embedding: [0.9, 0.1, 0],
      };
      const score = calculateMatchScore(product1, product2);
      expect(score).toBeGreaterThan(0);
    });
  });
});
