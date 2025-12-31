import { invokeLLM } from "./_core/llm";

/**
 * Generate embeddings for text using OpenAI's embedding model
 * Returns a vector that can be used for semantic similarity search
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Use OpenAI's text-embedding-3-small model for efficient embeddings
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * Returns a value between -1 and 1, where 1 means identical
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Calculate Levenshtein distance (edit distance) between two strings
 * Used for fuzzy string matching
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate string similarity as a percentage (0-1)
 * Combines Levenshtein distance with string length normalization
 */
export function stringSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  
  if (maxLength === 0) return 1;
  
  return 1 - distance / maxLength;
}

/**
 * Normalize product name for better matching
 * - Remove special characters
 * - Normalize whitespace
 * - Convert to lowercase
 */
export function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Remove special chars
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

/**
 * Extract key features from product name for matching
 * - Brand name
 * - Product type
 * - Size/quantity
 * - Color
 */
export function extractProductFeatures(name: string): {
  brand?: string;
  type?: string;
  size?: string;
  color?: string;
} {
  const normalized = normalizeProductName(name);
  const features: any = {};

  // Common brands (expand as needed)
  const brands = ["apple", "samsung", "sony", "lg", "nike", "adidas", "nestle", "almarai"];
  for (const brand of brands) {
    if (normalized.includes(brand)) {
      features.brand = brand;
      break;
    }
  }

  // Size patterns (e.g., "500ml", "1kg", "256gb")
  const sizeMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(ml|l|kg|g|gb|tb|oz|lb)/i);
  if (sizeMatch) {
    features.size = sizeMatch[0];
  }

  // Color patterns
  const colors = ["black", "white", "red", "blue", "green", "yellow", "pink", "purple", "silver", "gold"];
  for (const color of colors) {
    if (normalized.includes(color)) {
      features.color = color;
      break;
    }
  }

  return features;
}

/**
 * Calculate combined match score using multiple signals
 * - Semantic similarity (embedding cosine similarity)
 * - String similarity (Levenshtein)
 * - Feature matching (brand, size, etc.)
 */
export function calculateMatchScore(
  product1: {
    name: string;
    embedding?: number[];
  },
  product2: {
    name: string;
    embedding?: number[];
  }
): number {
  let score = 0;
  let weights = 0;

  // Semantic similarity (if embeddings available)
  if (product1.embedding && product2.embedding) {
    const semanticSim = cosineSimilarity(product1.embedding, product2.embedding);
    score += semanticSim * 0.5; // 50% weight
    weights += 0.5;
  }

  // String similarity
  const stringSim = stringSimilarity(product1.name, product2.name);
  score += stringSim * 0.3; // 30% weight
  weights += 0.3;

  // Feature matching
  const features1 = extractProductFeatures(product1.name);
  const features2 = extractProductFeatures(product2.name);
  
  let featureMatches = 0;
  let featureCount = 0;
  
  for (const key of ["brand", "size", "color"] as const) {
    if (features1[key] && features2[key]) {
      featureCount++;
      if (features1[key] === features2[key]) {
        featureMatches++;
      }
    }
  }
  
  if (featureCount > 0) {
    const featureSim = featureMatches / featureCount;
    score += featureSim * 0.2; // 20% weight
    weights += 0.2;
  }

  // Normalize score
  return weights > 0 ? score / weights : 0;
}
