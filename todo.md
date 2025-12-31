# PriceGenie MVP - Project TODO

## Database Schema & Infrastructure
- [x] Design and implement platforms table with scraping configuration
- [x] Design and implement products table (canonical) with pgvector embeddings
- [x] Design and implement raw_products table (scraped) with match confidence
- [x] Design and implement price_snapshots table with staleness tracking
- [x] Design and implement user_memberships table
- [x] Design and implement scrape_jobs table with status tracking
- [x] Design and implement price_alerts table for user notifications
- [x] Design and implement basket_items table for saved baskets
- [x] Create database indexes (GIN for JSONB, vector indexes for embeddings)
- [x] Generate realistic seed data with messy product variations
- [ ] Implement staleness calculation functions

## Backend API Layer
- [x] Implement POST /search - natural language product search with filters
- [x] Implement POST /basket/optimize - basket optimization with membership calculations
- [x] Implement GET /products/:id/prices - real-time prices with staleness indicators
- [x] Implement POST /deeplink/generate - platform deep links with affiliate tracking
- [x] Implement user membership CRUD operations
- [x] Implement price alert CRUD operations
- [x] Implement basket management operations
- [x] Implement admin endpoints for scrape job monitoring
- [x] Add proper input validation with Zod schemas
- [ ] Add error handling and rate limiting

## Background Workers & Scraping
- [x] Set up worker infrastructure for background tasks
- [x] Implement scrape_platform_prices task with fault tolerance
- [x] Implement generate_embeddings task for semantic search
- [x] Implement match_products task with fuzzy matching
- [ ] Implement priority re-scrape for stale prices
- [x] Add retry logic with exponential backoff
- [ ] Add circuit breaker for platform failures
- [ ] Add scraping metrics and monitoring
- [ ] Implement duplicate prevention with URL hashing
- [x] Create mock scrapers for testing

## AI & Machine Learning
- [ ] Integrate sentence-transformers for embedding generation
- [ ] Implement semantic similarity search using pgvector
- [ ] Implement fuzzy string matching for product titles
- [x] Implement basket optimization algorithm (NP-hard problem solver)
- [ ] Build natural language query parser
- [ ] Implement AI shopping assistant with conversational refinement
- [ ] Add confidence scoring for product matches

## Frontend - Core Features
- [x] Design mobile-first responsive layout
- [x] Implement product search interface with filters
- [x] Implement real-time price comparison display
- [x] Implement basket builder and optimizer
- [x] Implement membership toggle interface
- [x] Implement price staleness indicators (fresh/stale/expired)
- [x] Implement deep link checkout flow
- [x] Add loading states and error handling
- [ ] Implement optimistic updates for basket operations

## Frontend - Advanced Features
- [x] Build AI shopping assistant chat interface
- [x] Implement price alert creation and management
- [ ] Implement saved baskets feature
- [ ] Add product image display with S3 storage
- [ ] Implement search history and suggestions
- [ ] Add platform availability indicators
- [ ] Implement membership discount visualization
- [ ] Add basket cost breakdown with shipping

## Admin Panel
- [x] Build scrape job monitoring dashboard
- [x] Implement platform health status display
- [ ] Add match confidence analytics
- [x] Implement manual scrape trigger interface
- [ ] Add product matching review interface
- [ ] Implement platform configuration management
- [ ] Add system metrics and logs viewer

## PWA & Performance
- [x] Configure PWA manifest.json
- [ ] Implement service worker for offline support
- [x] Add app icons and splash screens
- [ ] Implement install prompt
- [ ] Optimize bundle size and lazy loading
- [ ] Add performance monitoring
- [ ] Implement caching strategies

## Testing & Quality
- [x] Write unit tests for basket optimization
- [ ] Write unit tests for product matching
- [ ] Write integration tests for search API
- [ ] Write tests for membership calculations
- [ ] Write tests for staleness logic
- [ ] Test PWA offline functionality
- [ ] Test mobile responsiveness
- [ ] Load testing for scraping workers

## Notifications & Alerts
- [ ] Implement price drop notifications
- [ ] Implement stock availability notifications
- [ ] Add notification preferences management
- [ ] Implement email/push notification delivery

## File Storage
- [ ] Set up S3 storage for product images
- [ ] Implement image upload and retrieval
- [ ] Add image optimization and resizing
- [ ] Prepare for future OCR receipt processing

## Sprint: Real Platform Scrapers (Current)
- [x] Install Playwright and dependencies
- [x] Implement Amazon UAE scraper with anti-bot measures
- [x] Implement Noon scraper with dynamic content handling
- [x] Implement Talabat scraper
- [x] Implement Careem scraper
- [ ] Add proxy rotation support
- [x] Add rate limiting per platform
- [x] Add scraper health monitoring
- [x] Integrate scrapers with existing worker system

## Sprint: Enhanced UI & Design System (Next)
- [ ] Implement color palette and typography from design-system.md
- [ ] Add Satoshi and JetBrains Mono fonts
- [ ] Create animation library with Framer Motion
- [ ] Enhanced product card with animations
- [ ] Platform comparison carousel
- [ ] Price history chart component
- [ ] Implement glassmorphism components
- [ ] Add micro-interactions and loading states


## Current Sprint: Complete UI Enhancements
- [x] Add micro-interactions (button hover effects, card lifts)
- [x] Create loading skeleton components for product cards
- [x] Implement shimmer loading effect for images
- [x] Add smooth page transitions with Framer Motion
- [x] Create responsive product grid layouts
- [x] Add empty state illustrations
- [ ] Implement toast notifications for user actions
- [ ] Add pull-to-refresh for mobile
- [ ] Create animated price comparison charts

## Next Sprint: Database Schema Enhancements
- [x] Add product categories table with hierarchy
- [x] Implement full-text search indexes
- [x] Add search history and analytics tables
- [x] Add product views tracking for popularity
- [ ] Create materialized views for performance
- [ ] Add database triggers for automatic updates
- [ ] Implement soft deletes for products
- [ ] Add audit logging tables
- [x] Optimize query performance with composite indexes


## Current Sprint: Semantic Search & Embeddings
- [x] Create embeddings service using sentence-transformers API
- [x] Implement cosine similarity search function
- [x] Add embedding generation for new products
- [x] Implement fuzzy product matching algorithm
- [x] Update search to use semantic similarity
- [ ] Test semantic search with product variations

## Next Sprint: Live Scraper Testing
- [ ] Test Amazon UAE scraper with real products
- [ ] Test Noon scraper with real products
- [ ] Test Talabat scraper with real products
- [ ] Test Careem scraper with real products
- [ ] Handle edge cases (out of stock, price not found)
- [ ] Add error logging and monitoring
- [ ] Optimize scraping performance

## Next Sprint: S3 Image Storage
- [x] Implement product image upload to S3
- [x] Add image URL storage in database
- [x] Create image processing utilities (resize, optimize)
- [x] Implement image scraping from platforms
- [x] Add fallback for missing images
- [ ] Test image upload and retrieval

## Next Sprint: Scheduled Jobs
- [x] Implement cron job for automated scraping
- [x] Schedule price updates every 6 hours
- [x] Add job monitoring and alerting
- [x] Implement retry logic for failed jobs
- [ ] Add job status dashboard


## Current Sprint: Price History Charts
- [x] Create price history data aggregation functions
- [x] Implement price trend calculation (up/down/stable)
- [x] Build PriceHistoryChart component with Recharts
- [x] Add time range selector (7d, 30d, 90d, all)
- [x] Display lowest/highest/average prices
- [x] Add price change indicators
- [x] Integrate charts into ProductDetail page

## Next Sprint: Push Notifications
- [x] Set up web push notification service
- [x] Implement notification permission request UI
- [x] Create notification subscription management
- [x] Add price drop notification triggers
- [x] Add back-in-stock notification triggers
- [x] Build notification preferences page
- [ ] Test notifications across browsers

## Next Sprint: Live Scraper Testing
- [ ] Test Amazon UAE scraper with real products
- [ ] Test Noon scraper with real products
- [ ] Test Talabat scraper with real products
- [ ] Test Careem scraper with real products
- [ ] Handle anti-bot challenges
- [ ] Add error recovery mechanisms
- [ ] Optimize scraping performance


## Current Sprint: Navigation & Feature Completion
- [x] Create global navigation header component
- [x] Add logo and home link
- [x] Add navigation menu (Search, Assistant, Basket, Alerts, Profile)
- [x] Add user profile dropdown with logout
- [x] Make navigation responsive for mobile
- [x] Add active page indicators
- [x] Complete Profile page with user info and settings
- [ ] Add breadcrumbs for deep pages
- [ ] Test all navigation flows
- [ ] Polish UI consistency across all pages
