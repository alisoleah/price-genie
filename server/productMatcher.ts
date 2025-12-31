import { getDb } from "./db";
import { products, rawProducts } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { generateEmbedding, calculateMatchScore } from "./embeddings";

/**
 * Find the best matching canonical product for a raw scraped product
 * Uses semantic similarity and fuzzy matching
 */
export async function matchRawProductToCanonical(rawProduct: {
  id: number;
  rawTitle: string;
  embedding?: number[];
}): Promise<{
  productId: number | null;
  confidence: number;
}> {
  const db = await getDb();
  if (!db) {
    return { productId: null, confidence: 0 };
  }

  try {
    // Generate embedding if not provided
    let rawEmbedding = rawProduct.embedding;
    if (!rawEmbedding) {
      rawEmbedding = await generateEmbedding(rawProduct.rawTitle);
    }

    // Get all canonical products
    const allProducts = await db.select().from(products);

    if (allProducts.length === 0) {
      return { productId: null, confidence: 0 };
    }

    // Calculate match scores for all products
    let bestMatch: { productId: number; confidence: number } = {
      productId: allProducts[0].id,
      confidence: 0,
    };

    for (const product of allProducts) {
      const score = calculateMatchScore(
        { name: rawProduct.rawTitle, embedding: rawEmbedding },
        { name: product.canonicalName, embedding: product.embedding || undefined }
      );

      if (score > bestMatch.confidence) {
        bestMatch = {
          productId: product.id,
          confidence: score,
        };
      }
    }

    // Only return match if confidence is above threshold
    const CONFIDENCE_THRESHOLD = 0.7;
    if (bestMatch.confidence < CONFIDENCE_THRESHOLD) {
      return { productId: null, confidence: bestMatch.confidence };
    }

    return bestMatch;
  } catch (error) {
    console.error("Error matching product:", error);
    return { productId: null, confidence: 0 };
  }
}

/**
 * Create a new canonical product from a raw product if no match found
 */
export async function createCanonicalProduct(rawProduct: {
  rawTitle: string;
  rawDescription?: string;
  imageUrl?: string;
  embedding?: number[];
}): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Generate embedding if not provided
    let embedding = rawProduct.embedding;
    if (!embedding) {
      embedding = await generateEmbedding(rawProduct.rawTitle);
    }

    // Extract category and brand from title (simple heuristic)
    const { category, brand } = extractCategoryAndBrand(rawProduct.rawTitle);

    const result = await db.insert(products).values({
      canonicalName: rawProduct.rawTitle,
      category,
      brand,
      embedding,
      imageUrl: rawProduct.imageUrl,
    });

    return result[0].insertId;
  } catch (error) {
    console.error("Error creating canonical product:", error);
    return null;
  }
}

/**
 * Update raw product with matched canonical product ID
 */
export async function updateRawProductMatch(
  rawProductId: number,
  matchedProductId: number,
  confidence: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .update(rawProducts)
      .set({
        matchedProductId,
        matchConfidence: confidence,
      })
      .where(eq(rawProducts.id, rawProductId));
  } catch (error) {
    console.error("Error updating raw product match:", error);
  }
}

/**
 * Process all unmatched raw products and find matches
 */
export async function processUnmatchedProducts(): Promise<{
  matched: number;
  created: number;
  failed: number;
}> {
  const db = await getDb();
  if (!db) {
    return { matched: 0, created: 0, failed: 0 };
  }

  const stats = { matched: 0, created: 0, failed: 0 };

  try {
    // Get all raw products without a match
    const unmatchedProducts = await db
      .select()
      .from(rawProducts)
      .where(eq(rawProducts.matchedProductId, null as any));

    for (const rawProduct of unmatchedProducts) {
      try {
        // Try to find a match
        const match = await matchRawProductToCanonical({
          id: rawProduct.id,
          rawTitle: rawProduct.rawTitle,
          embedding: rawProduct.embedding || undefined,
        });

        if (match.productId) {
          // Found a match
          await updateRawProductMatch(rawProduct.id, match.productId, match.confidence);
          stats.matched++;
        } else {
          // No match found, create new canonical product
          const newProductId = await createCanonicalProduct({
            rawTitle: rawProduct.rawTitle,
            rawDescription: rawProduct.rawDescription || undefined,
            imageUrl: rawProduct.imageUrl || undefined,
            embedding: rawProduct.embedding || undefined,
          });

          if (newProductId) {
            await updateRawProductMatch(rawProduct.id, newProductId, 1.0);
            stats.created++;
          } else {
            stats.failed++;
          }
        }
      } catch (error) {
        console.error(`Error processing raw product ${rawProduct.id}:`, error);
        stats.failed++;
      }
    }
  } catch (error) {
    console.error("Error processing unmatched products:", error);
  }

  return stats;
}

/**
 * Simple heuristic to extract category and brand from product title
 * In production, this could use NLP or LLM for better extraction
 */
function extractCategoryAndBrand(title: string): {
  category?: string;
  brand?: string;
} {
  const titleLower = title.toLowerCase();
  
  // Common categories
  const categories: Record<string, string[]> = {
    "Electronics": ["iphone", "samsung", "laptop", "tv", "headphones", "airpods"],
    "Groceries": ["milk", "eggs", "bread", "cheese", "yogurt", "butter"],
    "Food & Beverage": ["pasta", "rice", "coffee", "tea", "juice", "water"],
    "Personal Care": ["shampoo", "soap", "toothpaste", "deodorant"],
    "Home & Kitchen": ["pan", "pot", "knife", "plate", "cup"],
  };

  let category: string | undefined;
  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => titleLower.includes(keyword))) {
      category = cat;
      break;
    }
  }

  // Common brands
  const brands = [
    "Apple", "Samsung", "Sony", "LG", "Nike", "Adidas", 
    "Nestle", "Almarai", "Coca-Cola", "Pepsi", "Danone"
  ];
  
  let brand: string | undefined;
  for (const b of brands) {
    if (titleLower.includes(b.toLowerCase())) {
      brand = b;
      break;
    }
  }

  return { category, brand };
}

/**
 * Search products using semantic similarity
 */
export async function semanticSearch(
  query: string,
  limit: number = 10
): Promise<Array<{
  product: typeof products.$inferSelect;
  similarity: number;
}>> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query);

    // Get all products with embeddings
    const allProducts = await db.select().from(products);

    // Calculate similarity scores
    const results = allProducts
      .map(product => ({
        product,
        similarity: product.embedding
          ? calculateMatchScore(
              { name: query, embedding: queryEmbedding },
              { name: product.canonicalName, embedding: product.embedding }
            )
          : 0,
      }))
      .filter(r => r.similarity > 0.5) // Minimum similarity threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error("Error in semantic search:", error);
    return [];
  }
}
