# @pricegenie/db

Database package for PriceGenie using Drizzle ORM with PostgreSQL.

## Schema

All database tables are defined in `/schema` directory:

- `platforms` - Platform configurations (Amazon UAE, Noon, Talabat, Careem, Carrefour)
- `categories` - Hierarchical product categories
- `products` - Canonical/normalized products with pgvector embeddings
- `raw_products` - Platform-specific scraped products
- `price_snapshots` - Time-series price data
- `users` - User accounts
- `user_memberships` - User platform memberships (Prime, Noon One, etc.)
- `user_baskets` - Shopping baskets
- `basket_items` - Items in user baskets
- `scrape_jobs` - Scraping job tracking

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment file:
   ```bash
   # .env
   DATABASE_URL=postgresql://user:password@localhost:5432/pricegenie
   ```

3. Generate migrations:
   ```bash
   npm run generate
   ```

4. Run migrations:
   ```bash
   npm run migrate
   ```

5. Seed database (development):
   ```bash
   npm run seed
   ```

## pgvector Extension

The database requires the pgvector extension for semantic search:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

This should be run manually on the database before running migrations.

## Usage

```typescript
import { db } from '@pricegenie/db';
import { products, categories } from '@pricegenie/db/schema';

// Query products
const allProducts = await db.select().from(products);

// Query with relations
const productWithCategory = await db.query.products.findFirst({
  with: {
    category: true,
  },
});
```

## Notes

- The schema includes `embedding` columns using a custom vector type for pgvector
- Price snapshots include computed `is_stale` column (scraped_at < NOW() - INTERVAL '1 hour')
- All tables use proper foreign key relationships
- Unique constraints prevent duplicate entries
