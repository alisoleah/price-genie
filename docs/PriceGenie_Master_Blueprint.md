# PriceGenie: Master Pre-Development Blueprint

**Version:** 1.0  
**Date:** December 27, 2025  
**Prepared by:** CTO & Lead Product Manager  
**Classification:** Internal - Development Team

---

## Table of Contents

1. [Comprehensive Product Requirements Document (PRD)](#1-comprehensive-product-requirements-document-prd)
2. [Detailed User Stories (Agile/Scrum Format)](#2-detailed-user-stories-agilescrum-format)
3. [Data Architecture & Schema (ERD)](#3-data-architecture--schema-erd)
4. [API & Interface Contracts](#4-api--interface-contracts)
5. [Technical Risk Assessment & Mitigation](#5-technical-risk-assessment--mitigation)
6. ["Day 0" Pre-Flight Checklist](#6-day-0-pre-flight-checklist)

---

# 1. Comprehensive Product Requirements Document (PRD)

## 1.1 Executive Summary

### Vision Statement
PriceGenie is an AI-powered shopping aggregator designed specifically for the GCC market (UAE, Saudi Arabia, Egypt) that eliminates the friction of multi-platform price comparison. By leveraging real-time web scraping, semantic AI product matching, and combinatorial basket optimization, PriceGenie delivers instant savings recommendations across Amazon UAE, Noon, Careem, Talabat, and Carrefour.

### Core Value Proposition
**"Never overpay online again."**

PriceGenie transforms the fragmented GCC e-commerce landscape—where identical products vary by 20-55% across platforms—into a single, intelligent shopping assistant that:

1. **Saves Time**: Eliminates the 14+ minutes consumers spend manually comparing prices per purchase
2. **Saves Money**: Identifies optimal vendor combinations considering memberships, delivery fees, and minimum orders
3. **Reduces Cognitive Load**: Natural language shopping queries replace complex multi-app navigation
4. **Respects User Choice**: Redirects to native platform checkouts via deep links—no logistics complexity

### Market Opportunity
- **TAM (2026)**: $55B GCC e-commerce market
- **SAM**: $22B multi-platform shoppers actively comparing prices
- **SOM**: $1B+ addressable through 500K-1M users via affiliate/subscription revenue
- **Key Insight**: 67% of GCC consumers already compare multiple apps—behavior is established, tool is missing

### Business Model

| Revenue Stream | Mechanism | Estimated Revenue |
|----------------|-----------|-------------------|
| **Affiliate Commissions** | 2-8% on redirected purchases | Primary (70% of revenue) |
| **Premium Subscription** | AED 9.99/month for price alerts, analytics | Secondary (20% of revenue) |
| **Sponsored Placements** | Brand priority positioning in results | Tertiary (10% of revenue) |

---

## 1.2 Feature Specifications

### 1.2.1 Real-Time Scraping Engine

**Purpose**: Extract live prices, availability, and product metadata from target platforms every 60-120 minutes.

**Technical Specification**:

| Component | Implementation |
|-----------|----------------|
| **Scraping Framework** | Playwright (JavaScript rendering) + Puppeteer (backup) |
| **Execution Environment** | Celery workers on Kubernetes pods with auto-scaling |
| **Rate Limiting** | 10 requests/minute per platform with rotating residential proxies |
| **Data Freshness Target** | ≤60 minutes for high-demand items, ≤24 hours for long-tail |

**Scraping Pipeline**:
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│ Job Queue   │────▶│ Proxy Router │────▶│ Playwright  │────▶│ HTML Parser  │
│ (Redis)     │     │ (SmartProxy) │     │ Worker Pool │     │ (BeautifulSoup)
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                                                                     │
                                                                     ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│ Price DB    │◀────│ Validation   │◀────│ Normalizer  │◀────│ Raw Product  │
│ (Postgres)  │     │ Layer        │     │ (Units/Curr)│     │ JSON         │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
```

**Platform-Specific Extraction Rules**:

| Platform | Category Pages | Product Details | Anti-Bot Measures |
|----------|---------------|-----------------|-------------------|
| **Amazon UAE** | `/s?k=` search endpoints | `/dp/` product pages | Captcha, IP rotation required |
| **Noon** | `/uae-en/` category URLs | `/product/` pages | Moderate bot detection |
| **Talabat** | `/restaurants/` + `/groceries/` | Inline JSON in HTML | Session-based tokens |
| **Careem** | Grocery API endpoints | JSON responses | API key rotation |
| **Carrefour** | `/mafuae/` category pages | `/p/` product pages | Light protection |

**Staleness Calculation Logic**:
```python
def calculate_staleness(scraped_at: datetime) -> StalenessLevel:
    age_hours = (datetime.utcnow() - scraped_at).total_seconds() / 3600
    if age_hours < 1:
        return StalenessLevel.FRESH      # Green indicator
    elif age_hours < 24:
        return StalenessLevel.STALE      # Yellow indicator, apply +5% uncertainty
    else:
        return StalenessLevel.EXPIRED    # Red indicator, trigger priority re-scrape
```

---

### 1.2.2 AI Product Matching (Fuzzy Matcher)

**Purpose**: Resolve entity identity across platforms where the same product has different names, SKUs, and descriptions.

**The Core Challenge**:
```
Amazon:  "Apple iPhone 13 Pro Max 256GB - Sierra Blue"
Noon:    "iPhone 13 Pro Max | 256 GB | Blue Sierra"
Careem:  "iPhone13 ProMax 256gb Blu"
```

**All three are the same product but require intelligent matching.**

**Hybrid Matching Pipeline**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STAGE 1: CANDIDATE RETRIEVAL                         │
│  Input: Raw product title → Generate embedding (all-MiniLM-L6-v2)          │
│  Query: pgvector similarity search → Top 10 candidates (cosine distance)    │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STAGE 2: FUZZY STRING SCORING                        │
│  For each candidate:                                                        │
│  - token_sort_ratio (rapidfuzz) → handles word reordering                   │
│  - partial_ratio → handles substring matches                                │
│  - Combine: fuzzy_score = 0.6 * token_sort + 0.4 * partial                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STAGE 3: ATTRIBUTE COMPARISON                        │
│  Extract structured attributes from title:                                  │
│  - Brand: "Apple" vs "Apple" → 1.0 match                                    │
│  - Capacity: "256GB" vs "256 GB" → normalize → 1.0 match                   │
│  - Color: "Sierra Blue" vs "Blue Sierra" → fuzzy match → 0.95              │
│  attribute_score = weighted average of matched attributes                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STAGE 4: FINAL SCORING                               │
│  final_score = 0.5 * vector_similarity                                      │
│              + 0.3 * fuzzy_score                                            │
│              + 0.2 * attribute_score                                        │
│                                                                             │
│  Decision:                                                                  │
│  - score ≥ 0.85 → AUTO-MATCH (link raw_product to canonical product)       │
│  - 0.60 ≤ score < 0.85 → MANUAL_REVIEW queue                               │
│  - score < 0.60 → CREATE new canonical product                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Unit Normalization Rules**:
```python
UNIT_MAPPINGS = {
    # Volume
    r'(\d+)\s*[Ll](?:iter)?s?': lambda m: f"{float(m.group(1)) * 1000}ml",
    r'(\d+(?:\.\d+)?)\s*[Mm][Ll]': lambda m: f"{m.group(1)}ml",
    
    # Weight  
    r'(\d+(?:\.\d+)?)\s*[Kk][Gg]': lambda m: f"{float(m.group(1)) * 1000}g",
    r'(\d+(?:\.\d+)?)\s*[Gg](?:rams?)?': lambda m: f"{m.group(1)}g",
    
    # Data storage
    r'(\d+)\s*[Tt][Bb]': lambda m: f"{int(m.group(1)) * 1024}GB",
    r'(\d+)\s*[Gg][Bb]': lambda m: f"{m.group(1)}GB",
}
```

**Multi-Language Support** (Arabic ↔ English):
- Use `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` for bilingual embeddings
- Arabic product titles: "حليب المراعي طازج 1 لتر" matches "Almarai Fresh Milk 1L"

---

### 1.2.3 Basket Optimization Engine

**Purpose**: Solve the combinatorial optimization problem of finding the cheapest way to purchase N items across M platforms, considering shipping fees, membership discounts, and minimum order values.

**Problem Classification**: This is a variant of the **Weighted Set Cover Problem**, which is NP-hard. For baskets with ≤20 items and ≤5 platforms, exact solutions via dynamic programming are tractable. Beyond that, we use greedy approximation with guaranteed bounds.

**Optimization Model**:

```
MINIMIZE:
    Total_Cost = Σ(item_prices) + Σ(platform_shipping_fees) - Σ(membership_discounts)

SUBJECT TO:
    1. Coverage: Every item must be purchased exactly once
    2. Availability: item.availability ≠ OUT_OF_STOCK
    3. Minimum Orders: Σ(items_per_platform) ≥ platform.min_order OR exclude_platform
    4. Staleness Penalty: stale_prices get +5% uncertainty margin
    
DECISION VARIABLES:
    x[i,p] ∈ {0,1} = 1 if item i purchased from platform p
```

**Algorithm Selection by Basket Size**:

| Items | Platforms | Algorithm | Time Complexity | Optimality |
|-------|-----------|-----------|-----------------|------------|
| 1-10 | 2-5 | Exact DP (bitmask) | O(2^n * m) | Optimal |
| 11-25 | 2-5 | Branch & Bound | O(2^n) worst | Optimal |
| 26-50 | 2-5 | Greedy + Local Search | O(n * m) | ≤1.5x optimal |
| 50+ | 5+ | ILP Solver (OR-Tools) | Variable | Near-optimal |

**Shipping Fee Model**:
```typescript
interface ShippingTier {
  platform: Platform;
  thresholds: {
    freeShippingMinimum: number;    // e.g., AED 100 for Noon
    standardFee: number;             // e.g., AED 10
    expressMultiplier: number;       // e.g., 1.5x for same-day
  };
  membershipOverride?: {
    membershipType: 'PRIME' | 'NOON_ONE' | 'TALABAT_PRO';
    freeShippingMinimum: number;     // e.g., AED 0 for Prime
    discountPercent: number;         // e.g., 5% off for Noon One
  };
}
```

---

### 1.2.4 Deep Link Generation

**Purpose**: Redirect users to native platform checkout with pre-populated carts where possible.

**Deep Link Strategies by Platform**:

| Platform | Deep Link Format | Cart Pre-fill | Affiliate Tracking |
|----------|-----------------|---------------|-------------------|
| **Amazon UAE** | `amazon.ae/dp/{ASIN}?tag={affiliate_id}` | No (add to cart manual) | `tag=` parameter |
| **Noon** | `noon.com/uae-en/product/{SKU}?ref={affiliate_id}` | No | `ref=` parameter |
| **Talabat** | `talabat://product/{id}` (app) | Yes (intent extras) | Custom tracking |
| **Careem** | `careem://grocery/item/{id}` | Limited | UTM parameters |

---

## 1.3 User Flows

### 1.3.1 Deal Hunter Persona - Complete Flow

**Persona**: Fatima, 28, Dubai resident, compares 3-4 apps before every purchase, subscribes to Noon One and Amazon Prime.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: ONBOARDING (First Launch)                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Screen: Welcome + Value Proposition                                         │
│ Action: "Get Started" → Membership Setup                                    │
│                                                                             │
│ Screen: Membership Configuration                                            │
│ - Toggle: Amazon Prime [ON/OFF]                                            │
│ - Toggle: Noon One [ON/OFF]                                                │
│ - Toggle: Talabat Pro [ON/OFF]                                             │
│ - Toggle: Carrefour Loyalty [ON/OFF]                                       │
│ Action: "Save Preferences" → Home Screen                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: PRODUCT SEARCH                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Screen: Home with Search Bar                                                │
│ Input: "iPhone 15 Pro Max 256GB"                                           │
│ Processing: Query → Embedding → Fuzzy Match → Price Retrieval              │
│ Loading: Skeleton UI + "Comparing prices across 5 platforms..."            │
│ Time Target: <3 seconds                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: COMPARISON RESULTS                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Screen: Price Comparison Card                                               │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐    │
│ │ iPhone 15 Pro Max 256GB                                             │    │
│ │ ────────────────────────────────────────────────────────────────── │    │
│ │ 🏆 BEST PRICE                                                       │    │
│ │ ┌─────────────────┬─────────────────┬─────────────────┐            │    │
│ │ │ Amazon UAE      │ Noon            │ Carrefour       │            │    │
│ │ │ AED 4,199 🟢    │ AED 4,399 🟡    │ AED 4,499 🔴    │            │    │
│ │ │ Fresh (23m ago) │ Stale (18h)     │ Fresh (45m)     │            │    │
│ │ │ In Stock        │ In Stock        │ Low Stock       │            │    │
│ │ │ Prime: Free Ship│ +AED 10 Ship    │ +AED 15 Ship    │            │    │
│ │ └─────────────────┴─────────────────┴─────────────────┘            │    │
│ │                                                                     │    │
│ │ [Add to Basket]  [Buy Now → Amazon]  [Set Price Alert]             │    │
│ └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4-6: BASKET BUILDING → OPTIMIZATION → CHECKOUT                        │
│ (User builds basket, taps optimize, sees split recommendation, checks out) │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1.4 Non-Functional Requirements

### 1.4.1 Performance Requirements

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Search Response Time** | <3 seconds (p95) | Client-side timing |
| **Basket Optimization Time** | <6 seconds (p95) | Server-side timing |
| **Scrape Freshness** | <1 hour for top 1000 products | Background job timestamps |
| **Deep Link Generation** | <500ms | Inline timing |
| **App Cold Start** | <2 seconds | First contentful paint |
| **API Availability** | 99.5% uptime | Prometheus monitoring |

### 1.4.2 Security & Compliance

| Requirement | Implementation |
|-------------|----------------|
| **Data Encryption** | TLS 1.3 in transit, AES-256 at rest |
| **Authentication** | OAuth 2.0 (Google, Apple Sign-In) + JWT |
| **PII Handling** | No storage of payment data; minimal PII |
| **GDPR/Privacy** | UAE PDPL compliance, data export/deletion on request |
| **Rate Limiting** | 100 requests/minute per user |

---

# 2. Detailed User Stories (Agile/Scrum Format)

## Epic 1: Product Search & Discovery

### US-1.1: Single Product Search
**As a** Deal Hunter  
**I want to** search for a specific product by name  
**So that** I can see prices across all platforms instantly

**Story Points:** 5  
**Priority:** P0 (Must Have)

**Acceptance Criteria:**
1. ✅ **GIVEN** I enter "iPhone 15 Pro Max" in the search bar  
   **WHEN** I submit the search  
   **THEN** I see results within 3 seconds
   
2. ✅ **GIVEN** search results are displayed  
   **WHEN** I view a product card  
   **THEN** I see prices from at least 3 platforms (Amazon, Noon, Carrefour)
   
3. ✅ **GIVEN** a product has varying prices  
   **WHEN** results are shown  
   **THEN** the cheapest option is highlighted with a "Best Price" badge
   
4. ✅ **GIVEN** some prices are stale (>1 hour old)  
   **WHEN** viewing the product card  
   **THEN** I see a yellow "Stale" indicator with timestamp
   
5. ✅ **GIVEN** a product is out of stock on one platform  
   **WHEN** viewing results  
   **THEN** that platform shows "Out of Stock" and is excluded from "Best Price"

---

### US-1.2: Natural Language Search (AI Assistant)
**As a** Busy Professional  
**I want to** describe what I need in plain English  
**So that** the AI suggests relevant products

**Story Points:** 8  
**Priority:** P1 (Should Have)

**Acceptance Criteria:**
1. ✅ **GIVEN** I type "healthy breakfast options under 50 AED"  
   **WHEN** I submit the query  
   **THEN** the AI returns categorized results (cereals, yogurt, fruit) with prices
   
2. ✅ **GIVEN** my query is ambiguous ("something for my cat")  
   **WHEN** the AI responds  
   **THEN** it asks a clarifying question
   
3. ✅ **GIVEN** I'm in the AI chat interface  
   **WHEN** I tap a suggested product  
   **THEN** I can add it directly to my basket

---

## Epic 2: Price Comparison

### US-2.1: Platform Price Comparison
**As an** Everyday Shopper  
**I want to** see all prices for a product side-by-side  
**So that** I can make an informed decision

**Story Points:** 3  
**Priority:** P0 (Must Have)

**Acceptance Criteria:**
1. ✅ **GIVEN** I view a product's comparison card  
   **WHEN** prices are displayed  
   **THEN** I see the price, shipping cost, and availability for each platform
   
2. ✅ **GIVEN** I have Amazon Prime membership enabled  
   **WHEN** viewing Amazon prices  
   **THEN** I see "Free Shipping (Prime)" instead of standard shipping cost
   
3. ✅ **GIVEN** prices differ by >20%  
   **WHEN** viewing the comparison  
   **THEN** I see a "Save X%" badge on the cheapest option

---

### US-2.2: Membership-Aware Pricing
**As a** Deal Hunter with multiple memberships  
**I want** prices to automatically reflect my membership benefits  
**So that** I see my actual cost

**Story Points:** 5  
**Priority:** P0 (Must Have)

**Acceptance Criteria:**
1. ✅ **GIVEN** I have Noon One enabled in settings  
   **WHEN** viewing Noon prices  
   **THEN** I see the 5% discounted price
   
2. ✅ **GIVEN** I toggle a membership on/off in settings  
   **WHEN** I return to search results  
   **THEN** prices update to reflect the change

---

## Epic 3: Basket Management

### US-3.1: Add Items to Basket
**As an** Everyday Shopper  
**I want to** add items to a basket from search results  
**So that** I can compare and optimize multiple items together

**Story Points:** 3  
**Priority:** P0 (Must Have)

**Acceptance Criteria:**
1. ✅ **GIVEN** I'm viewing a product comparison  
   **WHEN** I tap "Add to Basket"  
   **THEN** the item is added with the cheapest platform pre-selected
   
2. ✅ **GIVEN** I add the same item twice  
   **WHEN** viewing the basket  
   **THEN** the quantity increments (not duplicate entries)

---

### US-3.2: Basket Optimization
**As a** Deal Hunter  
**I want to** optimize my entire basket across platforms  
**So that** I pay the absolute minimum for all items combined

**Story Points:** 13  
**Priority:** P0 (Must Have)

**Acceptance Criteria:**
1. ✅ **GIVEN** I have 5 items in my basket  
   **WHEN** I tap "Optimize Basket"  
   **THEN** I see results within 6 seconds
   
2. ✅ **GIVEN** optimization completes  
   **WHEN** viewing results  
   **THEN** I see items grouped by recommended platform with subtotals
   
3. ✅ **GIVEN** the optimized split saves money  
   **WHEN** viewing results  
   **THEN** I see "Original: AED X" vs "Optimized: AED Y" with savings highlighted
   
4. ✅ **GIVEN** one item is out of stock everywhere  
   **WHEN** optimization runs  
   **THEN** I see that item flagged with "Unavailable - Remove or find alternative?"

---

### US-3.3: Minimum Order Handling
**As a** user with a small basket  
**I want** the optimizer to handle minimum order requirements  
**So that** I'm not surprised by hidden fees

**Story Points:** 5  
**Priority:** P1 (Should Have)

**Acceptance Criteria:**
1. ✅ **GIVEN** Noon requires AED 100 minimum for free shipping  
   **WHEN** my Noon subtotal is AED 80  
   **THEN** the optimizer shows "Add AED 20 more for free shipping" or shifts items
   
2. ✅ **GIVEN** no combination meets minimum orders  
   **WHEN** optimization completes  
   **THEN** I see shipping costs included with clear breakdown

---

## Epic 4: Checkout & Deep Links

### US-4.1: Platform Redirect
**As a** user ready to purchase  
**I want to** go directly to each platform's checkout  
**So that** I can complete my purchase without copy-pasting

**Story Points:** 5  
**Priority:** P0 (Must Have)

**Acceptance Criteria:**
1. ✅ **GIVEN** I tap "Checkout on Amazon"  
   **WHEN** the action executes  
   **THEN** Amazon app opens (or website if app not installed)
   
2. ✅ **GIVEN** the deep link includes affiliate tracking  
   **WHEN** I complete purchase on Amazon  
   **THEN** the affiliate commission is tracked

---

## Epic 5: User Account & Memberships

### US-5.1: Membership Management
**As a** user with platform subscriptions  
**I want to** configure my active memberships  
**So that** prices reflect my actual benefits

**Story Points:** 3  
**Priority:** P0 (Must Have)

**Acceptance Criteria:**
1. ✅ **GIVEN** I access Settings > Memberships  
   **WHEN** viewing the screen  
   **THEN** I see toggles for: Amazon Prime, Noon One, Talabat Pro, Carrefour Loyalty
   
2. ✅ **GIVEN** membership settings change  
   **WHEN** I have items in basket  
   **THEN** basket total auto-recalculates

---

## Epic 6: Admin & Operations

### US-6.1: Scraping Dashboard
**As an** Admin  
**I want to** monitor scraping job health  
**So that** I can ensure data freshness and fix failures

**Story Points:** 5  
**Priority:** P1 (Should Have)

**Acceptance Criteria:**
1. ✅ **GIVEN** I access the Admin Panel  
   **WHEN** viewing the dashboard  
   **THEN** I see scraping status for each platform (Success/Failed/Running)
   
2. ✅ **GIVEN** staleness exceeds 30%  
   **WHEN** threshold is breached  
   **THEN** I receive an alert notification
# 3. Data Architecture & Schema (ERD)

## 3.1 Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PRICEGENIE DATA MODEL                                │
└─────────────────────────────────────────────────────────────────────────────┘

                                    ┌───────────────┐
                                    │   platforms   │
                                    │───────────────│
                                    │ id (PK)       │
                                    │ name          │
                                    │ base_url      │
                                    │ scrape_config │
                                    └───────┬───────┘
                                            │
           ┌────────────────────────────────┼────────────────────────────────┐
           │                                │                                │
           ▼                                ▼                                ▼
┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│   raw_products      │         │  price_snapshots    │         │   scrape_jobs       │
│─────────────────────│         │─────────────────────│         │─────────────────────│
│ id (PK)             │◀────────│ raw_product_id (FK) │         │ id (PK)             │
│ platform_id (FK)    │         │ price               │         │ platform_id (FK)    │
│ raw_title           │         │ currency            │         │ status              │
│ raw_description     │         │ availability        │         │ started_at          │
│ url                 │         │ scraped_at          │         │ completed_at        │
│ image_url           │         │ is_stale (computed) │         │ products_scraped    │
│ matched_product_id  │         └─────────────────────┘         │ errors (JSONB)      │
│ match_confidence    │                                         └─────────────────────┘
│ embedding (vector)  │
└──────────┬──────────┘
           │
           │ matched_product_id (FK)
           ▼
┌─────────────────────┐         ┌─────────────────────┐
│   products          │         │   categories        │
│   (Canonical)       │         │─────────────────────│
│─────────────────────│         │ id (PK)             │
│ id (PK)             │◀────────│ name                │
│ canonical_name      │         │ parent_id (FK, self)│
│ category_id (FK)    │────────▶│ slug                │
│ brand               │         └─────────────────────┘
│ attributes (JSONB)  │
│ embedding (vector)  │
└─────────────────────┘



┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│   users             │         │  user_memberships   │         │   user_baskets      │
│─────────────────────│         │─────────────────────│         │─────────────────────│
│ id (PK)             │◀────────│ user_id (FK)        │         │ id (PK)             │
│ email               │         │ platform_id (FK)    │◀────────│ user_id (FK)        │
│ name                │         │ membership_type     │         │ name                │
│ created_at          │         │ active              │         │ created_at          │
│ auth_provider       │         │ expires_at          │         └──────────┬──────────┘
└─────────────────────┘         └─────────────────────┘                    │
                                                                           │
                                                                           ▼
                                                               ┌─────────────────────┐
                                                               │   basket_items      │
                                                               │─────────────────────│
                                                               │ id (PK)             │
                                                               │ basket_id (FK)      │
                                                               │ product_id (FK)     │
                                                               │ quantity            │
                                                               │ preferred_platform  │
                                                               │ added_at            │
                                                               └─────────────────────┘
```

## 3.2 Detailed Schema Definitions

### 3.2.1 Core Tables

```sql
-- ============================================
-- PLATFORMS TABLE
-- ============================================
CREATE TABLE platforms (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) UNIQUE NOT NULL,   -- 'amazon_uae', 'noon', 'talabat', etc.
    display_name    VARCHAR(100) NOT NULL,         -- 'Amazon UAE', 'Noon', etc.
    base_url        VARCHAR(255) NOT NULL,
    logo_url        VARCHAR(255),
    scrape_config   JSONB NOT NULL DEFAULT '{}',   -- Rate limits, selectors, proxy rules
    affiliate_id    VARCHAR(100),
    deep_link_template VARCHAR(500),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Example scrape_config:
-- {
--   "rate_limit_rpm": 10,
--   "requires_js": true,
--   "proxy_required": true,
--   "selectors": {
--     "price": ".price-display",
--     "title": ".product-title"
--   }
-- }

-- ============================================
-- CATEGORIES TABLE (Hierarchical)
-- ============================================
CREATE TABLE categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    parent_id       INTEGER REFERENCES categories(id),
    icon            VARCHAR(50),
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PRODUCTS TABLE (Canonical/Normalized)
-- ============================================
CREATE TABLE products (
    id              SERIAL PRIMARY KEY,
    canonical_name  VARCHAR(500) NOT NULL,         -- "Apple iPhone 15 Pro Max 256GB"
    category_id     INTEGER REFERENCES categories(id),
    brand           VARCHAR(100),                  -- "Apple"
    attributes      JSONB NOT NULL DEFAULT '{}',   -- {"storage": "256GB", "color": "Natural Titanium"}
    embedding       VECTOR(768),                   -- For semantic search (pgvector)
    image_url       VARCHAR(500),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create HNSW index for fast similarity search
CREATE INDEX ON products USING hnsw (embedding vector_cosine_ops);

-- GIN index for JSONB attribute queries
CREATE INDEX idx_products_attributes ON products USING GIN (attributes);

-- ============================================
-- RAW_PRODUCTS TABLE (Platform-Specific, Unnormalized)
-- ============================================
CREATE TABLE raw_products (
    id                  SERIAL PRIMARY KEY,
    platform_id         INTEGER NOT NULL REFERENCES platforms(id),
    platform_sku        VARCHAR(100),              -- Platform's own product ID
    raw_title           VARCHAR(1000) NOT NULL,    -- "iPhone 15 Pro Max | 256 GB | Titanium Blue"
    raw_description     TEXT,
    url                 VARCHAR(1000) NOT NULL,
    image_url           VARCHAR(500),
    matched_product_id  INTEGER REFERENCES products(id),  -- Link to canonical product
    match_confidence    DECIMAL(3,2),              -- 0.00 to 1.00
    match_status        VARCHAR(20) DEFAULT 'PENDING',   -- PENDING, AUTO_MATCHED, MANUAL_REVIEW, REJECTED
    embedding           VECTOR(768),
    last_scraped_at     TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(platform_id, url)  -- Prevent duplicate entries
);

CREATE INDEX ON raw_products USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_raw_products_match_status ON raw_products(match_status);
CREATE INDEX idx_raw_products_platform ON raw_products(platform_id);

-- ============================================
-- PRICE_SNAPSHOTS TABLE (Time-Series)
-- ============================================
CREATE TABLE price_snapshots (
    id              SERIAL PRIMARY KEY,
    raw_product_id  INTEGER NOT NULL REFERENCES raw_products(id),
    price           NUMERIC(10,2) NOT NULL,        -- Precise decimal, never float
    currency        CHAR(3) DEFAULT 'AED',
    original_price  NUMERIC(10,2),                 -- Before discount (if available)
    discount_percent DECIMAL(5,2),
    availability    VARCHAR(20) NOT NULL,          -- IN_STOCK, LOW_STOCK, OUT_OF_STOCK
    shipping_fee    NUMERIC(10,2),
    scraped_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Computed column for staleness
    is_stale        BOOLEAN GENERATED ALWAYS AS (
        scraped_at < NOW() - INTERVAL '1 hour'
    ) STORED
);

-- Optimized index for "latest price per product" queries
CREATE INDEX idx_price_snapshots_latest 
ON price_snapshots(raw_product_id, scraped_at DESC);

-- Partial index for fresh prices only
CREATE INDEX idx_price_snapshots_fresh 
ON price_snapshots(raw_product_id) 
WHERE is_stale = false;
```

### 3.2.2 User & Membership Tables

```sql
-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    name            VARCHAR(100),
    avatar_url      VARCHAR(500),
    auth_provider   VARCHAR(20) NOT NULL,          -- 'google', 'apple', 'email'
    auth_provider_id VARCHAR(255),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at   TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- USER_MEMBERSHIPS TABLE
-- ============================================
CREATE TABLE user_memberships (
    id              SERIAL PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform_id     INTEGER NOT NULL REFERENCES platforms(id),
    membership_type VARCHAR(50) NOT NULL,          -- 'PRIME', 'NOON_ONE', 'TALABAT_PRO'
    active          BOOLEAN DEFAULT true,
    benefits        JSONB DEFAULT '{}',            -- {"free_shipping_min": 0, "discount_percent": 5}
    expires_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, platform_id, membership_type)
);

-- ============================================
-- USER_BASKETS TABLE
-- ============================================
CREATE TABLE user_baskets (
    id              SERIAL PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(100) DEFAULT 'My Basket',
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_baskets_active 
ON user_baskets(user_id) 
WHERE is_active = true;

-- ============================================
-- BASKET_ITEMS TABLE
-- ============================================
CREATE TABLE basket_items (
    id                  SERIAL PRIMARY KEY,
    basket_id           INTEGER NOT NULL REFERENCES user_baskets(id) ON DELETE CASCADE,
    product_id          INTEGER NOT NULL REFERENCES products(id),
    quantity            INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    preferred_platform_id INTEGER REFERENCES platforms(id),
    added_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(basket_id, product_id)
);
```

### 3.2.3 Operations Tables

```sql
-- ============================================
-- SCRAPE_JOBS TABLE
-- ============================================
CREATE TABLE scrape_jobs (
    id              SERIAL PRIMARY KEY,
    platform_id     INTEGER NOT NULL REFERENCES platforms(id),
    job_type        VARCHAR(50) NOT NULL,          -- 'FULL_CRAWL', 'CATEGORY_UPDATE', 'PRICE_REFRESH'
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    started_at      TIMESTAMP WITH TIME ZONE,
    completed_at    TIMESTAMP WITH TIME ZONE,
    products_scraped INTEGER DEFAULT 0,
    products_failed INTEGER DEFAULT 0,
    errors          JSONB DEFAULT '[]',
    next_retry_at   TIMESTAMP WITH TIME ZONE,
    retry_count     INTEGER DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PRODUCT_MATCH_QUEUE TABLE (Manual Review)
-- ============================================
CREATE TABLE product_match_queue (
    id              SERIAL PRIMARY KEY,
    raw_product_id  INTEGER NOT NULL REFERENCES raw_products(id),
    candidate_product_id INTEGER REFERENCES products(id),
    match_score     DECIMAL(3,2),
    reviewed_by     UUID REFERENCES users(id),
    review_status   VARCHAR(20) DEFAULT 'PENDING',
    reviewed_at     TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PRICE_ALERTS TABLE (Phase 2)
-- ============================================
CREATE TABLE price_alerts (
    id              SERIAL PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id      INTEGER NOT NULL REFERENCES products(id),
    target_price    NUMERIC(10,2) NOT NULL,
    current_lowest  NUMERIC(10,2),
    is_triggered    BOOLEAN DEFAULT false,
    triggered_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 3.3 Fuzzy Match Relationship Model

The **canonical product** (in `products` table) represents the normalized, deduplicated entity. Multiple **raw products** (in `raw_products` table) can link to the same canonical product through the `matched_product_id` foreign key.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FUZZY MATCHING RELATIONSHIP                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ CANONICAL PRODUCT (products table)                                          │
│ ─────────────────────────────────                                           │
│ id: 1                                                                       │
│ canonical_name: "Apple iPhone 15 Pro Max 256GB Natural Titanium"           │
│ brand: "Apple"                                                              │
│ attributes: {"storage": "256GB", "color": "Natural Titanium", "model": "15 Pro Max"}
│ embedding: [0.12, -0.45, 0.78, ...] (768 dimensions)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                        ▲
                                        │ matched_product_id = 1
                                        │
    ┌───────────────────────────────────┼───────────────────────────────────┐
    │                                   │                                   │
┌───┴───────────────┐   ┌───────────────┴───────────┐   ┌───────────────────┴───┐
│ RAW PRODUCT       │   │ RAW PRODUCT               │   │ RAW PRODUCT           │
│ (Amazon UAE)      │   │ (Noon)                    │   │ (Carrefour)           │
│───────────────────│   │───────────────────────────│   │───────────────────────│
│ id: 101           │   │ id: 102                   │   │ id: 103               │
│ platform_id: 1    │   │ platform_id: 2            │   │ platform_id: 3        │
│ raw_title:        │   │ raw_title:                │   │ raw_title:            │
│ "Apple iPhone 15  │   │ "iPhone 15 Pro Max |      │   │ "APPLE IPHONE 15      │
│  Pro Max 256GB    │   │  256 GB | Natural         │   │  PRO MAX 256GB        │
│  - Natural        │   │  Titanium"                │   │  TITANIUM"            │
│  Titanium"        │   │                           │   │                       │
│ match_confidence: │   │ match_confidence: 0.92    │   │ match_confidence: 0.88│
│ 0.98              │   │ match_status: AUTO_MATCHED│   │ match_status: AUTO... │
└───────────────────┘   └───────────────────────────┘   └───────────────────────┘
         │                           │                           │
         ▼                           ▼                           ▼
┌───────────────────┐   ┌───────────────────────────┐   ┌───────────────────────┐
│ PRICE_SNAPSHOT    │   │ PRICE_SNAPSHOT            │   │ PRICE_SNAPSHOT        │
│───────────────────│   │───────────────────────────│   │───────────────────────│
│ price: 5199.00    │   │ price: 5399.00            │   │ price: 5299.00        │
│ availability:     │   │ availability: IN_STOCK    │   │ availability: LOW_STOCK│
│ IN_STOCK          │   │ shipping_fee: 10.00       │   │ shipping_fee: 15.00   │
│ shipping_fee: 0   │   │ scraped_at: 2h ago        │   │ scraped_at: 45m ago   │
│ (Prime)           │   │ is_stale: true            │   │ is_stale: false       │
│ scraped_at: 30m   │   │                           │   │                       │
│ is_stale: false   │   │                           │   │                       │
└───────────────────┘   └───────────────────────────┘   └───────────────────────┘
```

## 3.4 Mermaid ERD Diagram

```mermaid
erDiagram
    PLATFORMS ||--o{ RAW_PRODUCTS : "has many"
    PLATFORMS ||--o{ SCRAPE_JOBS : "has many"
    PLATFORMS ||--o{ USER_MEMBERSHIPS : "offers"
    
    CATEGORIES ||--o{ PRODUCTS : "contains"
    CATEGORIES ||--o{ CATEGORIES : "parent of"
    
    PRODUCTS ||--o{ RAW_PRODUCTS : "matched by"
    PRODUCTS ||--o{ BASKET_ITEMS : "in baskets"
    PRODUCTS ||--o{ PRICE_ALERTS : "tracked by"
    
    RAW_PRODUCTS ||--o{ PRICE_SNAPSHOTS : "has prices"
    RAW_PRODUCTS ||--o{ PRODUCT_MATCH_QUEUE : "pending review"
    
    USERS ||--o{ USER_MEMBERSHIPS : "has"
    USERS ||--o{ USER_BASKETS : "owns"
    USERS ||--o{ PRICE_ALERTS : "sets"
    
    USER_BASKETS ||--o{ BASKET_ITEMS : "contains"
    
    PLATFORMS {
        int id PK
        string name UK
        string display_name
        string base_url
        jsonb scrape_config
        string affiliate_id
    }
    
    CATEGORIES {
        int id PK
        string name
        string slug UK
        int parent_id FK
    }
    
    PRODUCTS {
        int id PK
        string canonical_name
        int category_id FK
        string brand
        jsonb attributes
        vector embedding
    }
    
    RAW_PRODUCTS {
        int id PK
        int platform_id FK
        string raw_title
        string url UK
        int matched_product_id FK
        decimal match_confidence
        string match_status
        vector embedding
    }
    
    PRICE_SNAPSHOTS {
        int id PK
        int raw_product_id FK
        decimal price
        string availability
        timestamp scraped_at
        boolean is_stale
    }
    
    USERS {
        uuid id PK
        string email UK
        string name
        string auth_provider
    }
    
    USER_MEMBERSHIPS {
        int id PK
        uuid user_id FK
        int platform_id FK
        string membership_type
        boolean active
    }
    
    USER_BASKETS {
        int id PK
        uuid user_id FK
        boolean is_active
    }
    
    BASKET_ITEMS {
        int id PK
        int basket_id FK
        int product_id FK
        int quantity
    }
    
    SCRAPE_JOBS {
        int id PK
        int platform_id FK
        string status
        int products_scraped
        jsonb errors
    }
    
    PRICE_ALERTS {
        int id PK
        uuid user_id FK
        int product_id FK
        decimal target_price
        boolean is_triggered
    }
```
# 4. API & Interface Contracts

## 4.1 Core API Endpoints

### 4.1.1 POST /api/v1/search

**Purpose**: Search for products with optional AI-powered natural language processing.

**Request Schema**:
```typescript
interface SearchRequest {
  query: string;                      // "iPhone 15 Pro Max" or "healthy breakfast under 50 AED"
  useAI?: boolean;                    // default: false
  filters?: {
    categoryId?: number;
    platforms?: string[];             // ["amazon_uae", "noon"]
    priceRange?: { min?: number; max?: number; };
    availability?: 'IN_STOCK' | 'ANY';
  };
  pagination?: { page?: number; limit?: number; };
  userMemberships?: {
    amazon_prime?: boolean;
    noon_one?: boolean;
    talabat_pro?: boolean;
  };
}
```

**Response Schema**:
```typescript
interface SearchResponse {
  success: boolean;
  data: {
    products: Array<{
      id: number;
      canonicalName: string;
      brand: string;
      category: { id: number; name: string; slug: string; };
      imageUrl: string;
      attributes: Record<string, string>;
      prices: Array<{
        platformId: number;
        platformName: string;
        price: number;
        currency: 'AED';
        availability: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
        shippingFee: number;
        totalCost: number;
        staleness: 'FRESH' | 'STALE' | 'EXPIRED';
        lastUpdated: string;
        deepLinkUrl: string;
        isBestPrice: boolean;
      }>;
      lowestPrice: number;
      highestPrice: number;
      savingsPercent: number;
    }>;
    pagination: { currentPage: number; totalPages: number; totalResults: number; };
  };
  meta: { queryTime: number; matchingTime: number; };
}
```

**Example Request**:
```json
{
  "query": "iPhone 15 Pro Max 256GB",
  "filters": { "platforms": ["amazon_uae", "noon"], "availability": "IN_STOCK" },
  "userMemberships": { "amazon_prime": true }
}
```

---

### 4.1.2 POST /api/v1/basket/optimize

**Purpose**: Find the optimal vendor split for a basket of items.

**Request Schema**:
```typescript
interface BasketOptimizeRequest {
  items: Array<{ productId: number; quantity: number; }>;
  memberships: {
    amazon_prime: boolean;
    noon_one: boolean;
    talabat_pro: boolean;
    carrefour_loyalty: boolean;
  };
  preferences?: {
    prioritize: 'PRICE' | 'SHIPPING_SPEED' | 'SINGLE_VENDOR';
    maxPlatforms?: number;
    budgetLimit?: number;
  };
}
```

**Response Schema**:
```typescript
interface BasketOptimizeResponse {
  success: boolean;
  data: {
    summary: {
      originalTotal: number;
      optimizedTotal: number;
      totalSavings: number;
      savingsPercent: number;
      platformCount: number;
      optimizationConfidence: number;
    };
    platformSplits: Array<{
      platformId: number;
      platformName: string;
      items: Array<{
        productId: number;
        productName: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
        availability: 'IN_STOCK' | 'LOW_STOCK';
        staleness: 'FRESH' | 'STALE';
      }>;
      subtotal: number;
      shippingFee: number;
      membershipDiscount: number;
      platformTotal: number;
      meetsMinimumOrder: boolean;
      checkoutUrl: string;
      itemDeepLinks: Array<{ productId: number; url: string; }>;
    }>;
    warnings: Array<{
      type: 'OUT_OF_STOCK' | 'STALE_PRICE' | 'BELOW_MINIMUM' | 'BUDGET_EXCEEDED';
      message: string;
      affectedItems: number[];
    }>;
  };
  meta: { optimizationTime: number; algorithm: string; };
}
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "originalTotal": 5423.00,
      "optimizedTotal": 5287.50,
      "totalSavings": 135.50,
      "savingsPercent": 2.50,
      "platformCount": 2,
      "optimizationConfidence": 0.94
    },
    "platformSplits": [
      {
        "platformId": 1,
        "platformName": "Amazon UAE",
        "items": [
          {
            "productId": 12345,
            "productName": "iPhone 15 Pro Max 256GB",
            "quantity": 1,
            "unitPrice": 5199.00,
            "subtotal": 5199.00,
            "availability": "IN_STOCK",
            "staleness": "FRESH"
          }
        ],
        "subtotal": 5199.00,
        "shippingFee": 0,
        "membershipDiscount": 0,
        "platformTotal": 5199.00,
        "meetsMinimumOrder": true,
        "checkoutUrl": "https://amazon.ae/cart?items=B0CHX1234",
        "itemDeepLinks": [
          { "productId": 12345, "url": "https://amazon.ae/dp/B0CHX1234?tag=pricegenie-21" }
        ]
      },
      {
        "platformId": 3,
        "platformName": "Carrefour",
        "items": [
          { "productId": 12346, "productName": "Almarai Fresh Milk 1L", "quantity": 2, "unitPrice": 6.50, "subtotal": 13.00 },
          { "productId": 12347, "productName": "Farm Fresh Eggs 30-pack", "quantity": 4, "unitPrice": 12.00, "subtotal": 48.00 }
        ],
        "subtotal": 88.50,
        "shippingFee": 0,
        "platformTotal": 88.50,
        "meetsMinimumOrder": true
      }
    ],
    "warnings": [
      {
        "type": "STALE_PRICE",
        "message": "Price for Dove Soap may have changed (last updated 18 hours ago)",
        "affectedItems": [12348]
      }
    ]
  }
}
```

---

### 4.1.3 GET /api/v1/products/{id}/prices

**Purpose**: Get real-time prices for a specific canonical product.

**Response Schema**:
```typescript
interface ProductPricesResponse {
  success: boolean;
  data: {
    product: { id: number; canonicalName: string; brand: string; imageUrl: string; };
    prices: Array<{
      platformId: number;
      platformName: string;
      price: number;
      availability: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
      staleness: 'FRESH' | 'STALE' | 'EXPIRED';
      lastUpdated: string;
      deepLinkUrl: string;
    }>;
    stats: { lowestPrice: number; highestPrice: number; averagePrice: number; };
  };
}
```

---

### 4.1.4 POST /api/v1/deeplink/generate

**Purpose**: Generate affiliate-tracked deep links for checkout.

**Request Schema**:
```typescript
interface DeepLinkRequest {
  items: Array<{ platformId: number; productId: number; platformSku: string; }>;
  userId?: string;
}
```

**Response Schema**:
```typescript
interface DeepLinkResponse {
  success: boolean;
  data: {
    links: Array<{
      platformId: number;
      platformName: string;
      deepLinkUrl: string;
      fallbackWebUrl: string;
      expiresAt: string;
      trackingId: string;
    }>;
  };
}
```

---

### 4.1.5 Basket CRUD Endpoints

```typescript
// GET /api/v1/basket - Get current user's basket
// POST /api/v1/basket/items - Add item to basket
// PATCH /api/v1/basket/items/{id} - Update quantity
// DELETE /api/v1/basket/items/{id} - Remove item

interface BasketItemRequest {
  productId: number;
  quantity: number;
  preferredPlatformId?: number;
}
```

---

### 4.1.6 Membership Endpoints

```typescript
// GET /api/v1/memberships - Get user's membership settings
// PUT /api/v1/memberships - Update membership settings

interface MembershipSettings {
  amazon_prime: boolean;
  noon_one: boolean;
  talabat_pro: boolean;
  carrefour_loyalty: boolean;
}
```

---

## 4.2 Admin API Endpoints

### 4.2.1 Scraping Management

```typescript
// GET /api/v1/admin/scrape-jobs - List all scrape jobs
// POST /api/v1/admin/scrape-jobs - Trigger new scrape job
// GET /api/v1/admin/scrape-jobs/{id} - Get job details
// POST /api/v1/admin/scrape-jobs/{id}/retry - Retry failed job

interface ScrapeJobRequest {
  platformId: number;
  jobType: 'FULL_CRAWL' | 'CATEGORY_UPDATE' | 'PRICE_REFRESH';
  categoryId?: number;
}

interface ScrapeJobResponse {
  id: number;
  platformId: number;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  startedAt: string | null;
  completedAt: string | null;
  productsScraped: number;
  productsFailed: number;
  errors: Array<{ message: string; productUrl: string; }>;
}
```

### 4.2.2 Product Match Review

```typescript
// GET /api/v1/admin/match-queue - List pending matches for review
// POST /api/v1/admin/match-queue/{id}/approve - Approve match
// POST /api/v1/admin/match-queue/{id}/reject - Reject match
// POST /api/v1/admin/match-queue/{id}/merge - Merge with different product

interface MatchQueueItem {
  id: number;
  rawProduct: { id: number; title: string; platform: string; };
  candidateProduct: { id: number; canonicalName: string; };
  matchScore: number;
  suggestedAction: 'APPROVE' | 'REVIEW' | 'REJECT';
}
```

---

## 4.3 Error Response Format

All error responses follow this standard format:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable message
    details?: any;          // Additional context
    requestId: string;      // For debugging
  };
}
```

**Common Error Codes**:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `OPTIMIZATION_FAILED` | 500 | Basket optimization error |
| `SCRAPE_FAILED` | 500 | Scraping operation failed |
| `MATCH_FAILED` | 500 | Product matching error |

---

## 4.4 Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

**JWT Payload**:
```typescript
interface JWTPayload {
  sub: string;              // User UUID
  email: string;
  name: string;
  iat: number;              // Issued at
  exp: number;              // Expiration (24h)
}
```

**Rate Limits**:
- Unauthenticated: 20 requests/minute
- Authenticated: 100 requests/minute
- Premium users: 300 requests/minute
# 5. Technical Risk Assessment & Mitigation

## 5.1 Risk Matrix Overview

| Risk | Probability | Impact | Priority | Status |
|------|-------------|--------|----------|--------|
| Scraper Blocking & Platform Changes | HIGH | HIGH | P0 | Active Mitigation |
| Basket Optimization Performance | MEDIUM | HIGH | P1 | Active Mitigation |
| Fuzzy Match Hallucinations | MEDIUM | MEDIUM | P2 | Active Mitigation |
| Data Freshness Degradation | MEDIUM | MEDIUM | P2 | Monitoring |
| Deep Link Breakage | LOW | MEDIUM | P3 | Monitoring |

---

## 5.2 Risk 1: Scraper Blocking & Platform Changes (P0 - CRITICAL)

### Risk Description
E-commerce platforms actively combat scraping through:
- IP blocking and rate limiting
- CAPTCHAs and bot detection (DataDome, PerimeterX)
- Dynamic page structure changes
- API authentication changes

**Historical Incidents**:
- Amazon: Aggressive bot detection, IP bans within 50 requests without proxy rotation
- Noon: Session-based tokens that expire, requiring re-authentication
- Talabat: Frequent front-end changes breaking CSS selectors

### Mitigation Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SCRAPING RESILIENCE ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │   Scrape Job    │
                              │   Scheduler     │
                              └────────┬────────┘
                                       │
                              ┌────────┴────────┐
                              │  Rate Limiter   │
                              │ (per-platform)  │
                              └────────┬────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │ Residential     │    │ Datacenter      │    │ Mobile          │
    │ Proxy Pool      │    │ Proxy Pool      │    │ Proxy Pool      │
    │ (SmartProxy)    │    │ (Bright Data)   │    │ (Oxylabs)       │
    └────────┬────────┘    └────────┬────────┘    └────────┬────────┘
              │                      │                      │
              └──────────────────────┼──────────────────────┘
                                     │
                           ┌─────────┴─────────┐
                           │   Proxy Router    │
                           │ (Intelligent      │
                           │  Selection)       │
                           └─────────┬─────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
          ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
          │ Playwright  │  │ Puppeteer   │  │ Raw HTTP    │
          │ (JS sites)  │  │ (Backup)    │  │ (Simple)    │
          └─────────────┘  └─────────────┘  └─────────────┘
```

### Specific Mitigations

| Strategy | Implementation | Fallback |
|----------|----------------|----------|
| **Proxy Rotation** | SmartProxy residential IPs (10K pool) | Bright Data datacenter |
| **Rate Limiting** | Token bucket: 10 req/min for Amazon | Exponential backoff |
| **Fingerprint Randomization** | Random User-Agent, viewport, timezone | Playwright stealth |
| **CAPTCHA Handling** | 2Captcha integration | Manual queue for critical products |
| **Selector Redundancy** | 3 selector strategies per field | ML-based auto-repair |
| **Circuit Breaker** | Trip after 3 consecutive failures | Auto-reset after 1 hour |

### Circuit Breaker Implementation

```python
class ScraperCircuitBreaker:
    """
    Implements circuit breaker pattern for scraping resilience.
    States: CLOSED (normal), OPEN (blocked), HALF_OPEN (testing)
    """
    
    def __init__(self, platform_id: str, failure_threshold: int = 3, reset_timeout: int = 3600):
        self.platform_id = platform_id
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.failure_count = 0
        self.state = CircuitState.CLOSED
        self.last_failure_time = None
        
    async def execute(self, scrape_func):
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitState.HALF_OPEN
            else:
                raise CircuitOpenError(f"Circuit open for {self.platform_id}")
        
        try:
            result = await scrape_func()
            self._on_success()
            return result
        except (RateLimitError, BlockedError) as e:
            self._on_failure(e)
            raise
    
    def _on_failure(self, error):
        self.failure_count += 1
        self.last_failure_time = datetime.utcnow()
        
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            self._send_alert(f"Circuit OPEN for {self.platform_id}")
```

---

## 5.3 Risk 2: Basket Optimization Performance (P1 - HIGH)

### Risk Description
The basket optimization problem is NP-hard. For large baskets (>20 items) across multiple platforms, exhaustive search is computationally infeasible.

**Computational Complexity**:
- Exact solution: O(m^n) where n = items, m = platforms
- Example: 30 items × 5 platforms = 5^30 ≈ 9 × 10^20 combinations
- Target latency: <6 seconds

### Mitigation Strategy

**Algorithm Selection by Basket Size**:

| Items | Algorithm | Time | Optimality |
|-------|-----------|------|------------|
| 1-10 | Exact DP (bitmask) | <1s | Optimal |
| 11-25 | Branch & Bound | <3s | Optimal |
| 26-50 | Greedy + Local Search | <6s | ≤1.5x optimal |
| 50+ | ILP Solver (OR-Tools) | <6s | Near-optimal |

### Exact DP Implementation (Small Baskets)

```python
def optimize_basket_exact_dp(items, platforms, memberships):
    """
    Bitmask DP for small baskets (≤10 items).
    Time: O(2^n × m), Space: O(2^n)
    """
    n = len(items)
    INF = float('inf')
    dp = {0: 0}
    parent = {0: None}
    
    # Precompute costs
    costs = {}
    for i, item in enumerate(items):
        for p, platform in enumerate(platforms):
            price = get_price(item.product_id, platform.id)
            if price and price.availability != 'OUT_OF_STOCK':
                costs[(i, p)] = apply_discount(price.price, platform, memberships) * item.quantity
    
    # DP over all subsets
    for mask in range(1, 1 << n):
        dp[mask] = INF
        for i in range(n):
            if not (mask & (1 << i)):
                continue
            prev_mask = mask ^ (1 << i)
            for p in range(len(platforms)):
                if (i, p) not in costs:
                    continue
                shipping = calculate_shipping(mask, platforms[p], memberships)
                new_cost = dp.get(prev_mask, INF) + costs[(i, p)] + shipping
                if new_cost < dp[mask]:
                    dp[mask] = new_cost
                    parent[mask] = (p, i, prev_mask)
    
    return reconstruct_solution(parent, (1 << n) - 1, items, platforms)
```

### Caching Strategy

```python
class BasketOptimizationCache:
    """Cache optimization results for common item combinations."""
    
    def __init__(self, redis_client):
        self.redis = redis_client
        self.base_ttl = 900  # 15 minutes
    
    def get_cache_key(self, items, memberships):
        item_hash = hashlib.md5(
            json.dumps(sorted([(i.product_id, i.quantity) for i in items])).encode()
        ).hexdigest()[:16]
        membership_hash = hashlib.md5(json.dumps(memberships).encode()).hexdigest()[:8]
        return f"basket_opt:{item_hash}:{membership_hash}"
    
    async def get_or_compute(self, items, memberships, compute_func):
        key = self.get_cache_key(items, memberships)
        cached = await self.redis.get(key)
        if cached:
            return json.loads(cached)
        
        result = await compute_func()
        await self.redis.setex(key, self.base_ttl, json.dumps(result))
        return result
```

---

## 5.4 Risk 3: Fuzzy Match Hallucinations (P2 - MEDIUM)

### Risk Description
The AI-powered product matching can produce incorrect matches:
- **False Positives**: Matching different products (e.g., iPhone 15 ↔ iPhone 15 Pro)
- **False Negatives**: Missing identical products with different names

**Real-World Examples**:
```
FALSE POSITIVE (Dangerous):
  "Samsung Galaxy S24 Ultra 256GB" ↔ "Samsung Galaxy S24 256GB"
  → Different products (Ultra vs non-Ultra), score: 0.91 ❌

FALSE NEGATIVE (Lost Savings):
  "Apple AirPods Pro (2nd generation)" ↔ "AirPods Pro 2 with MagSafe"
  → Same product, score: 0.58 ❌
```

### Mitigation: Attribute-Based Validation

```python
class ProductAttributeExtractor:
    """Extracts structured attributes for validation."""
    
    PATTERNS = {
        'storage': [r'(\d+)\s*(GB|TB)'],
        'color': [r'\b(black|white|blue|red|gold|silver|titanium)\b'],
        'model': [r'(Pro|Pro Max|Ultra|Plus|Lite|Mini|SE)\b'],
        'brand': [r'^(Apple|Samsung|Sony|LG|Huawei|Xiaomi)'],
    }
    
    def extract(self, title: str) -> dict:
        attributes = {}
        for attr_name, patterns in self.PATTERNS.items():
            for pattern in patterns:
                match = re.search(pattern, title, re.IGNORECASE)
                if match:
                    attributes[attr_name] = self._normalize(attr_name, match.group(0))
                    break
        return attributes
    
    def compare_attributes(self, attrs1: dict, attrs2: dict) -> float:
        """Critical attributes (storage, model) have higher weight."""
        weights = {'brand': 0.20, 'model': 0.25, 'storage': 0.25, 'color': 0.15, 'size': 0.15}
        total_weight = 0
        total_score = 0
        
        for attr, weight in weights.items():
            if attr in attrs1 and attr in attrs2:
                total_weight += weight
                if attrs1[attr] == attrs2[attr]:
                    total_score += weight
        
        return total_score / total_weight if total_weight > 0 else 0.5
```

### Golden Dataset for Evaluation

```json
// 50 labeled pairs for F1 evaluation
{"id": 1, "title_a": "iPhone 15 Pro Max 256GB", "title_b": "iPhone 15 Pro Max 256 GB", "is_match": true}
{"id": 2, "title_a": "Samsung Galaxy S24 Ultra", "title_b": "Samsung Galaxy S24", "is_match": false}
{"id": 3, "title_a": "Almarai Fresh Milk 1L", "title_b": "المراعي حليب طازج 1 لتر", "is_match": true}
// ... 47 more pairs
```

**CI/CD Quality Gate**: F1 score must be ≥0.85 or build fails.

---

## 5.5 Risk Summary & Monitoring

### Key Metrics to Track

| Risk Area | Metric | Alert Threshold | Dashboard |
|-----------|--------|-----------------|-----------|
| Scraping | Success Rate by Platform | <90% | Grafana |
| Scraping | Average Staleness | >30% expired | Grafana |
| Optimization | p95 Latency | >6 seconds | Grafana |
| Matching | F1 Score (daily eval) | <0.85 | CI/CD |
| Matching | Manual Review Queue Size | >100 items | Slack |
| Deep Links | Click-through Rate | <50% | Analytics |

### Incident Response Playbook

1. **Scraper Blocked**: 
   - Circuit breaker auto-trips
   - Alert sent to on-call
   - Switch to backup proxy pool
   - Escalate if >2 platforms down

2. **Optimization Timeout**:
   - Fall back to greedy algorithm
   - Log for analysis
   - Cache result for similar baskets

3. **Match Confidence Drop**:
   - Review recent model changes
   - Check for platform title format changes
   - Retrain embedding model if needed
# 6. "Day 0" Pre-Flight Checklist

## 6.1 Cloud Infrastructure Setup

### 6.1.1 Compute & Hosting

| Item | Provider | Action Required | Owner | Status |
|------|----------|----------------|-------|--------|
| **Cloud Account** | AWS / GCP / Azure | Create organization account with billing | CTO | ⬜ |
| **Kubernetes Cluster** | EKS / GKE / AKS | Provision cluster (3 nodes min) | DevOps | ⬜ |
| **Container Registry** | ECR / GCR / ACR | Create private registry | DevOps | ⬜ |
| **CI/CD Platform** | GitHub Actions | Configure repository secrets | DevOps | ⬜ |
| **CDN** | CloudFront / Cloudflare | Setup for static assets | DevOps | ⬜ |

### 6.1.2 Database & Storage

| Item | Service | Configuration | Owner | Status |
|------|---------|--------------|-------|--------|
| **PostgreSQL** | RDS / Cloud SQL | db.r6g.large, Multi-AZ, 100GB | DevOps | ⬜ |
| **pgvector Extension** | Manual install | Enable for embeddings | Backend | ⬜ |
| **Redis** | ElastiCache / Memorystore | cache.m6g.large, cluster | DevOps | ⬜ |
| **Object Storage** | S3 / GCS | Bucket for images, exports | DevOps | ⬜ |
| **Backup Strategy** | Automated snapshots | Daily, 30-day retention | DevOps | ⬜ |

---

## 6.2 Third-Party Services & API Keys

### 6.2.1 Scraping Infrastructure

| Service | Purpose | Account Type | Est. Cost | Owner | Status |
|---------|---------|-------------|-----------|-------|--------|
| **SmartProxy** | Residential proxy rotation | Business (10K IPs) | ~$400/mo | Backend | ⬜ |
| **Bright Data** | Datacenter proxy backup | Pay-as-you-go | ~$100/mo | Backend | ⬜ |
| **2Captcha** | CAPTCHA solving | Credit-based | ~$50/mo | Backend | ⬜ |
| **ScrapingBee** | Alternative scraping API | Starter plan | ~$150/mo | Backend | ⬜ |

### 6.2.2 AI & ML Services

| Service | Purpose | Account Type | Est. Cost | Owner | Status |
|---------|---------|-------------|-----------|-------|--------|
| **Anthropic Claude** | AI query parsing (Sonnet) | API access | ~$200/mo | Backend | ⬜ |
| **OpenAI** | Backup LLM (GPT-4) | API access | ~$100/mo | Backend | ⬜ |
| **Hugging Face** | Embedding models | Community (free) | $0 | ML | ⬜ |

### 6.2.3 Affiliate & Tracking

| Platform | Program | Application Required | Commission | Owner | Status |
|----------|---------|---------------------|------------|-------|--------|
| **Amazon UAE Associates** | Affiliate | Yes (requires website) | 1-10% | Business | ⬜ |
| **Noon Affiliate** | Partner program | Yes (application) | 2-8% | Business | ⬜ |
| **Talabat Partners** | Affiliate | Business inquiry | TBD | Business | ⬜ |
| **Carrefour/MAF** | Affiliate | Business inquiry | TBD | Business | ⬜ |

### 6.2.4 Monitoring & Observability

| Service | Purpose | Plan | Est. Cost | Owner | Status |
|---------|---------|------|-----------|-------|--------|
| **Grafana Cloud** | Dashboards, metrics | Free tier | $0 | DevOps | ⬜ |
| **Sentry** | Error tracking | Team plan | ~$26/mo | Backend | ⬜ |
| **PagerDuty** | Incident alerting | Starter | ~$20/mo | DevOps | ⬜ |
| **Logtail** | Log aggregation | Free tier | $0 | DevOps | ⬜ |

---

## 6.3 Development Environment Setup

### 6.3.1 Repository & Version Control

| Item | Action | Details | Owner | Status |
|------|--------|---------|-------|--------|
| **GitHub Organization** | Create `pricegenie-app` | Private repos | CTO | ⬜ |
| **Monorepo Structure** | Initialize Turborepo | `/apps/web`, `/apps/api`, `/packages/*` | Lead Dev | ⬜ |
| **Branch Protection** | Configure `main` | Require PR reviews, CI pass | Lead Dev | ⬜ |
| **Secrets Management** | GitHub Secrets / Vault | Store API keys | DevOps | ⬜ |
| **CODEOWNERS** | Define ownership | Backend, Frontend, ML teams | Lead Dev | ⬜ |

### 6.3.2 Local Development Setup Script

```bash
# Developer machine requirements
# ================================

# 1. Install prerequisites
brew install node@20 python@3.11 docker postgresql@15 redis

# 2. Clone repository
git clone git@github.com:pricegenie-app/price-genie.git
cd price-genie

# 3. Install dependencies
pnpm install                    # Frontend + shared packages
cd apps/api && pip install -r requirements.txt  # Backend

# 4. Setup local databases
docker-compose -f docker/docker-compose.dev.yml up -d

# 5. Run database migrations
pnpm db:migrate

# 6. Seed development data
pnpm db:seed

# 7. Start development servers
pnpm dev                        # Runs all apps in parallel
```

### 6.3.3 Environment Variables Template

```bash
# .env.example
# ============================================

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/pricegenie
REDIS_URL=redis://localhost:6379

# API Keys - Scraping
SMARTPROXY_USERNAME=
SMARTPROXY_PASSWORD=
TWOCAPTCHA_API_KEY=

# API Keys - AI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# API Keys - Affiliates
AMAZON_AFFILIATE_TAG=
NOON_AFFILIATE_ID=
TALABAT_PARTNER_KEY=

# Authentication
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=

# Monitoring
SENTRY_DSN=
GRAFANA_API_KEY=

# Feature Flags
ENABLE_AI_SEARCH=true
ENABLE_REAL_SCRAPING=false      # Use mock data in development
SCRAPER_RATE_LIMIT_RPM=10
```

---

## 6.4 Legal & Compliance

| Item | Requirement | Action | Owner | Status |
|------|-------------|--------|-------|--------|
| **Terms of Service** | User agreement | Draft with legal counsel | Legal | ⬜ |
| **Privacy Policy** | GDPR/PDPL compliance | Draft data handling policies | Legal | ⬜ |
| **Cookie Policy** | Consent management | Implement cookie banner | Frontend | ⬜ |
| **Scraping Legality** | Review robots.txt | Document platform policies | Legal | ⬜ |
| **Affiliate Disclosures** | FTC/UAE guidelines | Add disclosure text | Content | ⬜ |
| **Business License** | UAE trade license | Apply for e-commerce license | Business | ⬜ |

---

## 6.5 Team & Communication

| Tool | Purpose | Setup Required | Owner | Status |
|------|---------|----------------|-------|--------|
| **Slack** | Team communication | Create workspace, channels | PM | ⬜ |
| **Linear** | Issue tracking | Setup project, workflows | PM | ⬜ |
| **Notion** | Documentation | Create team workspace | PM | ⬜ |
| **Figma** | Design collaboration | Setup team project | Design | ⬜ |
| **Loom** | Async video updates | Team accounts | PM | ⬜ |

---

## 6.6 Pre-Launch Quality Gates

### 6.6.1 Technical Quality Gates

| Gate | Requirement | Measurement | Threshold |
|------|-------------|-------------|-----------|
| **Unit Test Coverage** | Core services | Jest + Pytest | ≥80% |
| **Integration Tests** | API endpoints | Passing count | 100% pass |
| **Matching Accuracy** | Fuzzy match quality | F1 score | ≥0.85 |
| **Optimization Performance** | Basket calc speed | p95 latency | <6 seconds |
| **Security Scan** | No critical vulns | Snyk / Trivy | 0 critical |
| **Load Test** | Handle traffic | k6 load test | 1000 concurrent |

### 6.6.2 Business Quality Gates

| Gate | Requirement | Measurement | Threshold |
|------|-------------|-------------|-----------|
| **Platform Coverage** | Products scraped | Count per platform | ≥10K |
| **Price Freshness** | Data not stale | % <1hr old | ≥70% |
| **Affiliate Setup** | Revenue tracking | Test conversions | ≥2 platforms |
| **User Testing** | Beta feedback | NPS survey | ≥40 NPS |

---

## 6.7 Day 0 Checklist Summary

### Week 1: Foundation
- [ ] Cloud account created and billing configured
- [ ] GitHub organization and monorepo initialized
- [ ] PostgreSQL + Redis provisioned (development)
- [ ] pgvector extension enabled
- [ ] Docker Compose for local development working
- [ ] CI/CD pipeline skeleton deployed

### Week 2: External Dependencies
- [ ] SmartProxy account active with test proxies
- [ ] 2Captcha API key obtained
- [ ] Anthropic API key obtained
- [ ] Sentry project created
- [ ] Grafana dashboards scaffolded

### Week 3: Business Setup
- [ ] Amazon UAE Associates application submitted
- [ ] Noon affiliate program inquiry sent
- [ ] Legal review of scraping policies completed
- [ ] Privacy policy draft completed
- [ ] UAE trade license application initiated

### Week 4: Team Onboarding
- [ ] Slack workspace configured
- [ ] Linear project with MVP epics created
- [ ] Notion documentation structure established
- [ ] Development environment guide written
- [ ] First sprint planned and ready

---

# Appendix A: Technology Stack Summary

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| **Frontend** | React Native (Expo) | 51.x | Cross-platform mobile, PWA support |
| **Web Framework** | Next.js | 14.x | SSR for SEO, React Server Components |
| **Backend** | FastAPI | 0.109.x | Async Python, OpenAPI generation |
| **Task Queue** | Celery | 5.3.x | Distributed scraping workers |
| **Database** | PostgreSQL | 15.x | pgvector for embeddings, JSONB |
| **Cache** | Redis | 7.x | Session cache, Celery broker |
| **Vector Search** | pgvector | 0.6.x | Semantic product matching |
| **Embeddings** | sentence-transformers | 2.x | all-MiniLM-L6-v2 for embeddings |
| **LLM** | Claude Sonnet | 3.5 | Query parsing, NL understanding |
| **Scraping** | Playwright | 1.41.x | JavaScript rendering |
| **Fuzzy Matching** | rapidfuzz | 3.x | Fast string similarity |
| **Optimization** | OR-Tools | 9.x | ILP solver for large baskets |
| **Monitoring** | OpenTelemetry | 1.x | Traces, metrics, logs |
| **CI/CD** | GitHub Actions | N/A | Automated testing, deployment |

---

# Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Canonical Product** | Normalized, deduplicated representation of a product |
| **Raw Product** | Product as scraped from a platform, before matching |
| **Staleness** | Age of price data (Fresh <1hr, Stale 1-24hr, Expired >24hr) |
| **Basket Optimization** | Finding cheapest way to purchase items across platforms |
| **Deep Link** | URL that opens directly to a product in platform's app |
| **Fuzzy Matching** | Algorithms finding similar strings despite variations |
| **Circuit Breaker** | Pattern to stop calling a failing service |
| **F1 Score** | Harmonic mean of precision and recall |
| **NP-Hard** | Problem class with no known polynomial-time solution |

---

**Document Prepared By:** CTO & Lead Product Manager  
**Version:** 1.0  
**Last Updated:** December 27, 2025  
**Next Review:** Before Sprint 1 Planning
