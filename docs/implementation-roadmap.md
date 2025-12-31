# PriceGenie - Claude Code Implementation Roadmap

## How to Use This with Claude Code

### Step 1: Setup Repository
Give Claude Code this prompt first:
```
Initialize a monorepo for PriceGenie with:
- pnpm workspaces
- apps/mobile (Expo React Native)
- apps/web (Next.js 14)
- apps/api (FastAPI)
- packages/db (Drizzle ORM)
- packages/ui (shared components)

Use the CLAUDE.md file for project context.
```

### Step 2: Database First
```
Create the Drizzle schema based on this ERD:
[paste the ERD section from the blueprint]

Include:
- platforms table
- products (canonical) with pgvector embedding
- raw_products (platform-specific)
- price_snapshots with is_stale computed column
- users, user_memberships, user_baskets, basket_items
```

### Step 3: Feature-by-Feature
Reference specific user stories when building features.

---

## Sprint 1: Foundation (Week 1-2)

### Task 1.1: Database Schema
**Claude Code Prompt:**
```
Create Drizzle ORM schema for PostgreSQL with these tables:

1. platforms - id, name, display_name, base_url, scrape_config (jsonb), affiliate_id
2. categories - id, name, slug, parent_id (self-reference)  
3. products - id, canonical_name, category_id, brand, attributes (jsonb), embedding (vector 768)
4. raw_products - id, platform_id, raw_title, url, matched_product_id, match_confidence, match_status
5. price_snapshots - id, raw_product_id, price (decimal), currency, availability, scraped_at, is_stale (computed)

Add proper indexes including HNSW for vector columns.
```

### Task 1.2: Seed Data Generator
**Claude Code Prompt:**
```
Create a seed script that generates:
- 5 platforms (Amazon UAE, Noon, Talabat, Careem, Carrefour)
- 10 categories (Electronics, Groceries, etc.)
- 100 canonical products with realistic names
- 300 raw_products (3 per canonical, with slight name variations)
- 500 price_snapshots with varying prices and staleness

Use Faker for realistic data. Include some products that are out of stock.
```

### Task 1.3: Basic API Endpoints
**Claude Code Prompt:**
```
Create FastAPI endpoints:

1. GET /api/v1/products - List products with pagination
2. GET /api/v1/products/{id} - Get product with all platform prices
3. GET /api/v1/products/{id}/prices - Get latest prices per platform

Include:
- Pydantic models for request/response
- SQLAlchemy async queries
- Error handling
```

---

## Sprint 2: Search & Comparison (Week 3-4)

### Task 2.1: Product Search
**Claude Code Prompt:**
```
Implement product search endpoint:

POST /api/v1/search
{
  "query": "iPhone 15",
  "filters": {
    "categoryId": 1,
    "platforms": ["amazon_uae", "noon"],
    "availability": "IN_STOCK"
  }
}

Use pgvector for semantic search:
1. Generate embedding for query using sentence-transformers (all-MiniLM-L6-v2)
2. Find similar products using cosine distance
3. Return with prices from all platforms
4. Highlight best price per product

Return results in <3 seconds.
```

### Task 2.2: Price Comparison Card Component
**Claude Code Prompt:**
```
Create a React Native component for price comparison cards.

Use the design system from design-system.md:
- Dark theme with --color-bg-secondary background
- Satoshi font for text, JetBrains Mono for prices
- Staggered fade-in animation using Moti
- "BEST PRICE" badge with pulse glow animation
- Platform logos in grayscale, color on hover
- Staleness indicators (green/yellow/red dots)

Props:
- product: { id, name, imageUrl, prices: Array<PlatformPrice> }
- onAddToBasket: (productId) => void
```

### Task 2.3: Membership-Aware Pricing
**Claude Code Prompt:**
```
Extend the price calculation to apply membership discounts:

1. Add user_memberships table queries
2. Apply discounts:
   - Amazon Prime: Free shipping
   - Noon One: 5% discount + free shipping over AED 100
   - Talabat Pro: Free delivery
   - Carrefour Loyalty: Points multiplier

3. Show "with Prime" or "with Noon One" labels
4. Recalculate when user toggles memberships
```

---

## Sprint 3: Basket & Optimization (Week 5-6)

### Task 3.1: Basket CRUD
**Claude Code Prompt:**
```
Implement basket management:

Endpoints:
- GET /api/v1/basket - Get current basket
- POST /api/v1/basket/items - Add item (productId, quantity)
- PATCH /api/v1/basket/items/{id} - Update quantity
- DELETE /api/v1/basket/items/{id} - Remove item

Rules:
- One active basket per user
- Increment quantity if same product added
- Include current best price for each item
```

### Task 3.2: Basket Optimization Algorithm
**Claude Code Prompt:**
```
Implement basket optimization:

POST /api/v1/basket/optimize
{
  "items": [{"productId": 1, "quantity": 2}, ...],
  "memberships": {"amazon_prime": true, "noon_one": true}
}

Algorithm:
1. If ≤10 items: Use exact dynamic programming (bitmask DP)
2. If >10 items: Use greedy with local search

Optimization goal:
MINIMIZE total = Σ(item_prices) + Σ(shipping_fees) - Σ(membership_discounts)

Return:
- Original total vs optimized total
- Savings amount and percentage
- Items grouped by recommended platform
- Deep links for each platform checkout
```

### Task 3.3: Optimization Results UI
**Claude Code Prompt:**
```
Create the basket optimization results screen:

Show:
1. Summary card with big savings number (animated counter)
2. Platform splits with items grouped
3. Per-platform subtotal, shipping, discounts
4. "Checkout on [Platform]" buttons with platform brand colors
5. Warnings for stale prices or out-of-stock items

Use Moti for:
- Staggered entrance animation
- Savings number counting up
- Confetti animation on >10% savings
```

---

## Sprint 4: Polish & Launch (Week 7-8)

### Task 4.1: Deep Link Generation
**Claude Code Prompt:**
```
Implement deep link generation:

POST /api/v1/deeplink/generate
{
  "items": [{"platformId": 1, "productId": 123, "platformSku": "B0CHX1234"}]
}

Platform-specific formats:
- Amazon: https://amazon.ae/dp/{ASIN}?tag={affiliate_id}
- Noon: https://noon.com/uae-en/product/{SKU}?ref={affiliate_id}
- Talabat: talabat://product/{id}
- Careem: careem://grocery/item/{id}

Include:
- 24-hour expiration
- Fallback web URLs
- Click tracking IDs
```

### Task 4.2: Onboarding Flow
**Claude Code Prompt:**
```
Create onboarding screens:

1. Welcome screen with value proposition
2. Membership setup (toggle Prime, Noon One, etc.)
3. Category preferences (optional)
4. Push notification permission
5. Home screen

Use:
- Full-bleed illustrations
- Smooth page transitions (slide from right)
- Progress dots
- Skip button
```

### Task 4.3: Settings & Profile
**Claude Code Prompt:**
```
Create settings screen:

Sections:
1. Account (email, sign out)
2. Memberships (toggles with platform logos)
3. Notifications (price alerts toggle)
4. Appearance (dark/light theme)
5. About (version, terms, privacy)

Match design system:
- Grouped lists with --color-bg-secondary backgrounds
- Platform logos in color
- Toggle switches with smooth animation
```

---

## Testing Prompts

### Unit Tests
```
Write unit tests for the basket optimization algorithm:
1. Test exact DP with 5 items, 3 platforms
2. Test greedy fallback with 15 items
3. Test membership discount application
4. Test out-of-stock handling
5. Test minimum order requirements
```

### Integration Tests
```
Write integration tests for the search API:
1. Test basic keyword search returns results
2. Test category filter
3. Test platform filter
4. Test availability filter
5. Test pagination
6. Test response time <3 seconds
```

### E2E Tests
```
Write Detox E2E tests for mobile app:
1. User can search for a product
2. User can view price comparison
3. User can add item to basket
4. User can optimize basket
5. User can tap checkout and app opens
```

---

## Common Issues & Solutions

### Issue: pgvector not working
```
Solution: Ensure PostgreSQL has the extension enabled:
CREATE EXTENSION IF NOT EXISTS vector;
```

### Issue: Slow search queries
```
Solution: Create HNSW index:
CREATE INDEX ON products USING hnsw (embedding vector_cosine_ops);
```

### Issue: Type errors with Drizzle + pgvector
```
Solution: Use custom vector type:
import { customType } from 'drizzle-orm/pg-core';

const vector = customType<{ data: number[] }>({
  dataType() {
    return 'vector(768)';
  },
});
```

### Issue: React Native fonts not loading
```
Solution: Use expo-font with useFonts hook:
const [fontsLoaded] = useFonts({
  'Satoshi-Regular': require('./assets/fonts/Satoshi-Regular.otf'),
  'Clash-Display': require('./assets/fonts/ClashDisplay-Bold.otf'),
});
```
