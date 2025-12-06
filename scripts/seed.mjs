import { drizzle } from "drizzle-orm/mysql2";
import { platforms, products, rawProducts, priceSnapshots } from "../drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

// Seed platforms
const platformsData = [
  {
    name: "amazon",
    displayName: "Amazon UAE",
    baseUrl: "https://www.amazon.ae",
    logoUrl: "/platforms/amazon.png",
    scrapingConfig: { rateLimit: 10, enabled: true },
    isActive: true,
  },
  {
    name: "noon",
    displayName: "Noon",
    baseUrl: "https://www.noon.com",
    logoUrl: "/platforms/noon.png",
    scrapingConfig: { rateLimit: 10, enabled: true },
    isActive: true,
  },
  {
    name: "careem",
    displayName: "Careem Now",
    baseUrl: "https://www.careem.com",
    logoUrl: "/platforms/careem.png",
    scrapingConfig: { rateLimit: 10, enabled: true },
    isActive: true,
  },
  {
    name: "talabat",
    displayName: "Talabat Mart",
    baseUrl: "https://www.talabat.com",
    logoUrl: "/platforms/talabat.png",
    scrapingConfig: { rateLimit: 10, enabled: true },
    isActive: true,
  },
];

// Generate mock embeddings (768 dimensions)
function generateMockEmbedding() {
  return Array.from({ length: 768 }, () => Math.random() * 2 - 1);
}

// Messy product variations
const messyProducts = [
  // Electronics
  {
    canonical: "Apple iPhone 13 Pro Max 256GB Blue",
    category: "Electronics",
    brand: "Apple",
    attributes: { storage: "256GB", color: "Blue" },
    variations: [
      "iPhone 13 Pro Max 256GB Blue",
      "Apple iPhone 13 Pro Max - 256 GB (Blue)",
      "iPhone13 ProMax 256gb blue",
      "Apple iPhone 13 Pro Max 256GB Sierra Blue",
    ],
  },
  {
    canonical: "Samsung Galaxy S22 Ultra 512GB Black",
    category: "Electronics",
    brand: "Samsung",
    attributes: { storage: "512GB", color: "Black" },
    variations: [
      "Samsung Galaxy S22 Ultra 512GB Black",
      "Galaxy S22 Ultra - 512 GB (Phantom Black)",
      "SAMSUNG S22 Ultra 512gb",
      "Samsung S22Ultra 512GB Black",
    ],
  },
  {
    canonical: "Sony WH-1000XM5 Wireless Headphones Black",
    category: "Electronics",
    brand: "Sony",
    attributes: { color: "Black" },
    variations: [
      "Sony WH-1000XM5 Wireless Noise Cancelling Headphones Black",
      "Sony WH1000XM5 Headphones - Black",
      "SONY WH-1000XM5 Black",
      "Sony WH 1000XM5 Wireless Headphones",
    ],
  },
  {
    canonical: "Apple MacBook Air M2 13-inch 256GB Space Gray",
    category: "Electronics",
    brand: "Apple",
    attributes: { storage: "256GB", color: "Space Gray", screen: "13-inch" },
    variations: [
      "MacBook Air M2 13\" 256GB Space Gray",
      "Apple MacBook Air 13-inch M2 Chip 256GB SSD Space Grey",
      "MacBook Air M2 256gb space gray",
      "Apple MBA M2 13 256GB",
    ],
  },
  {
    canonical: "LG 55-inch 4K OLED TV",
    category: "Electronics",
    brand: "LG",
    attributes: { size: "55-inch", resolution: "4K" },
    variations: [
      "LG 55\" OLED 4K Smart TV",
      "LG OLED55C2PSA 55 Inch 4K Smart TV",
      "LG 55 inch OLED TV 4K",
      "LG 55\" 4K OLED Television",
    ],
  },
  
  // Groceries
  {
    canonical: "Almarai Fresh Milk Full Cream 1L",
    category: "Groceries",
    brand: "Almarai",
    attributes: { volume: "1L", type: "Full Cream" },
    variations: [
      "Almarai Fresh Milk 1L Full Cream",
      "Almarai Milk Full Cream 1 Liter",
      "Al Marai Fresh Milk 1000ml Full Cream",
      "ALMARAI MILK 1L",
    ],
  },
  {
    canonical: "Organic Eggs Large 12 Pack",
    category: "Groceries",
    brand: "Organic",
    attributes: { quantity: "12", size: "Large" },
    variations: [
      "Organic Large Eggs 12pcs",
      "Organic Eggs - Large (12 Pack)",
      "12 Large Organic Eggs",
      "Organic Eggs 12ct Large",
    ],
  },
  {
    canonical: "Barilla Penne Pasta 500g",
    category: "Groceries",
    brand: "Barilla",
    attributes: { weight: "500g", type: "Penne" },
    variations: [
      "Barilla Penne Rigate 500g",
      "Barilla Pasta Penne 500 grams",
      "BARILLA Penne 500g",
      "Barilla Penne Pasta 500gm",
    ],
  },
  {
    canonical: "Coca-Cola 330ml Can 6 Pack",
    category: "Groceries",
    brand: "Coca-Cola",
    attributes: { volume: "330ml", quantity: "6" },
    variations: [
      "Coca Cola 330ml x 6 Cans",
      "Coke 330ml Can (Pack of 6)",
      "Coca-Cola 6x330ml",
      "COCA COLA 330ML 6PK",
    ],
  },
  {
    canonical: "Lurpak Butter Salted 200g",
    category: "Groceries",
    brand: "Lurpak",
    attributes: { weight: "200g", type: "Salted" },
    variations: [
      "Lurpak Salted Butter 200g",
      "Lurpak Butter - Salted 200 grams",
      "LURPAK Butter Salted 200gm",
      "Lurpak 200g Salted",
    ],
  },
  
  // Personal Care
  {
    canonical: "Dove Soap Original 100g",
    category: "Personal Care",
    brand: "Dove",
    attributes: { weight: "100g", variant: "Original" },
    variations: [
      "Dove Beauty Bar Original 100g",
      "Dove Soap 100 grams Original",
      "DOVE Original Soap 100gm",
      "Dove Beauty Cream Bar 100g",
    ],
  },
  {
    canonical: "Colgate Total Toothpaste 75ml",
    category: "Personal Care",
    brand: "Colgate",
    attributes: { volume: "75ml", variant: "Total" },
    variations: [
      "Colgate Total Advanced Toothpaste 75ml",
      "Colgate Toothpaste Total 75 ml",
      "COLGATE Total 75ml",
      "Colgate Total Paste 75ml",
    ],
  },
  {
    canonical: "Nivea Soft Moisturizing Cream 200ml",
    category: "Personal Care",
    brand: "Nivea",
    attributes: { volume: "200ml", type: "Soft" },
    variations: [
      "Nivea Soft Cream 200ml",
      "NIVEA Soft Moisturizing Creme 200 ml",
      "Nivea Soft 200ml Cream",
      "Nivea Soft Moisturiser 200ml",
    ],
  },
  {
    canonical: "Head & Shoulders Shampoo Anti-Dandruff 400ml",
    category: "Personal Care",
    brand: "Head & Shoulders",
    attributes: { volume: "400ml", type: "Anti-Dandruff" },
    variations: [
      "Head and Shoulders Anti-Dandruff Shampoo 400ml",
      "H&S Shampoo 400 ml Anti Dandruff",
      "HEAD & SHOULDERS 400ml",
      "Head&Shoulders Anti-Dandruff 400ml",
    ],
  },
  {
    canonical: "Gillette Fusion5 Razor Blades 4 Pack",
    category: "Personal Care",
    brand: "Gillette",
    attributes: { quantity: "4", type: "Fusion5" },
    variations: [
      "Gillette Fusion 5 Blades 4ct",
      "Gillette Fusion5 Cartridges 4 Pack",
      "GILLETTE Fusion 5 Razor Blades x4",
      "Gillette Fusion5 4 Blades",
    ],
  },
];

async function seed() {
  console.log("🌱 Starting seed process...");

  // Insert platforms
  console.log("📦 Seeding platforms...");
  const insertedPlatforms = [];
  for (const platform of platformsData) {
    const [result] = await db.insert(platforms).values(platform);
    insertedPlatforms.push({ ...platform, id: result.insertId });
  }
  console.log(`✅ Inserted ${insertedPlatforms.length} platforms`);

  // Insert products and raw products
  console.log("🛍️  Seeding products...");
  let totalRawProducts = 0;
  let totalPriceSnapshots = 0;

  for (const productData of messyProducts) {
    // Insert canonical product
    const embedding = generateMockEmbedding();
    const [productResult] = await db.insert(products).values({
      canonicalName: productData.canonical,
      category: productData.category,
      brand: productData.brand,
      attributes: productData.attributes,
      embedding,
      imageUrl: `/products/placeholder-${productData.category.toLowerCase()}.jpg`,
    });
    const productId = productResult.insertId;

    // Insert 2-4 raw product variations across different platforms
    const numVariations = Math.floor(Math.random() * 3) + 2; // 2-4 variations
    for (let i = 0; i < numVariations; i++) {
      const platformIndex = i % insertedPlatforms.length;
      const platform = insertedPlatforms[platformIndex];
      const variation = productData.variations[i] || productData.variations[0];
      
      // Generate slightly different embedding for variation
      const variationEmbedding = embedding.map(v => v + (Math.random() * 0.2 - 0.1));
      
      const [rawProductResult] = await db.insert(rawProducts).values({
        platformId: platform.id,
        rawTitle: variation,
        rawDescription: `${variation} - Available on ${platform.displayName}`,
        url: `${platform.baseUrl}/product/${Math.random().toString(36).substring(7)}`,
        imageUrl: `/products/placeholder-${productData.category.toLowerCase()}.jpg`,
        matchedProductId: productId,
        matchConfidence: 0.85 + Math.random() * 0.15, // 0.85 to 1.0
        embedding: variationEmbedding,
      });
      const rawProductId = rawProductResult.insertId;
      totalRawProducts++;

      // Generate price snapshots with staleness variation
      const basePrice = Math.floor(Math.random() * 50000) + 1000; // 10 to 500 AED in fils
      const priceVariation = 1 + (Math.random() * 0.3 - 0.15); // ±15% variation
      const price = Math.floor(basePrice * priceVariation);

      // Staleness distribution: 30% fresh, 50% stale, 20% expired
      const stalenessRand = Math.random();
      let scrapedAt;
      if (stalenessRand < 0.3) {
        // Fresh: <1 hour ago
        scrapedAt = new Date(Date.now() - Math.random() * 60 * 60 * 1000);
      } else if (stalenessRand < 0.8) {
        // Stale: 1-24 hours ago
        scrapedAt = new Date(Date.now() - (1 + Math.random() * 23) * 60 * 60 * 1000);
      } else {
        // Expired: >24 hours ago
        scrapedAt = new Date(Date.now() - (24 + Math.random() * 48) * 60 * 60 * 1000);
      }

      // 10% out of stock
      const availability = Math.random() < 0.1 ? "out_of_stock" : 
                          Math.random() < 0.15 ? "low_stock" : "in_stock";

      await db.insert(priceSnapshots).values({
        rawProductId,
        price,
        currency: "AED",
        availability,
        scrapedAt,
      });
      totalPriceSnapshots++;
    }
  }

  console.log(`✅ Inserted ${messyProducts.length} canonical products`);
  console.log(`✅ Inserted ${totalRawProducts} raw products`);
  console.log(`✅ Inserted ${totalPriceSnapshots} price snapshots`);
  console.log("🎉 Seed completed successfully!");
}

seed()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
