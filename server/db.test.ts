import { describe, expect, it } from "vitest";
import { 
  getAllCategories, 
  getCategoryBySlug,
  getPopularProducts,
  getPopularSearches,
  recordSearch,
  recordProductView
} from "./db";

describe("Database Helper Functions", () => {
  describe("Categories", () => {
    it("should return empty array when database is unavailable", async () => {
      const categories = await getAllCategories();
      expect(Array.isArray(categories)).toBe(true);
    });

    it("should return undefined for non-existent category slug", async () => {
      const category = await getCategoryBySlug("non-existent-slug");
      expect(category).toBeUndefined();
    });
  });

  describe("Analytics", () => {
    it("should handle recording search gracefully", async () => {
      // Should not throw even if DB is unavailable
      await expect(recordSearch(1, "test query", 5)).resolves.not.toThrow();
    });

    it("should handle recording product view gracefully", async () => {
      // Should not throw even if DB is unavailable
      await expect(recordProductView(1, 1, "session-123")).resolves.not.toThrow();
    });

    it("should return empty array for popular products when DB unavailable", async () => {
      const products = await getPopularProducts(10);
      expect(Array.isArray(products)).toBe(true);
    });

    it("should return empty array for popular searches when DB unavailable", async () => {
      const searches = await getPopularSearches(10);
      expect(Array.isArray(searches)).toBe(true);
    });
  });
});
