# PriceGenie - Claude Code Project Context

## Project Overview
PriceGenie is an AI-powered shopping aggregator for the GCC market (UAE, Saudi, Egypt) that compares prices across Amazon UAE, Noon, Talabat, Careem, and Carrefour.

## Tech Stack
- **Frontend**: React Native (Expo) + Next.js for web
- **Backend**: FastAPI (Python) for scraping/matching, tRPC (TypeScript) for API
- **Database**: PostgreSQL 15 + pgvector + Drizzle ORM
- **Cache/Queue**: Redis 7 + Celery
- **AI**: Claude Sonnet (query parsing), sentence-transformers (embeddings)

## Repository Structure
```
price-genie/
├── apps/
│   ├── mobile/          # React Native (Expo)
│   ├── web/             # Next.js 14
│   └── api/             # FastAPI backend
├── packages/
│   ├── db/              # Drizzle schema + migrations
│   ├── ui/              # Shared React components
│   └── shared/          # TypeScript types, utils
├── services/
│   ├── scraper/         # Playwright scraping workers
│   └── matcher/         # ML product matching
└── docker/
```

## Key Design Decisions
1. **Canonical vs Raw Products**: Products table stores normalized entities; raw_products stores platform-specific scraped data with `matched_product_id` FK
2. **Staleness Tracking**: price_snapshots has `is_stale` computed column (>1hr = stale)
3. **Basket Optimization**: Use exact DP for ≤10 items, greedy for larger baskets
4. **Embeddings**: pgvector with all-MiniLM-L6-v2 (768 dimensions)

## Current Sprint Focus
Building MVP with core features:
1. Product search with price comparison
2. Basket building and optimization
3. Deep link checkout redirects
4. Membership-aware pricing

## Commands
```bash
pnpm dev          # Start all services
pnpm db:migrate   # Run migrations
pnpm db:seed      # Seed test data
pnpm test         # Run tests
```

## Important Files
- `/packages/db/schema.ts` - Database schema
- `/apps/api/routers/` - API endpoints
- `/apps/mobile/app/` - Mobile screens
- `/services/scraper/platforms/` - Platform-specific scrapers

## Design System
See `design-system.md` for colors, typography, and animation specs.
