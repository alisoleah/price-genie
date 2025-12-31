# PriceGenie - Comprehensive Testing Plan

This document provides a step-by-step guide to test all features of PriceGenie MVP.

---

## Prerequisites

Before testing, ensure:
- ✅ Development server is running (`pnpm dev`)
- ✅ Database is connected and seeded with test data
- ✅ Browser DevTools open (F12) for debugging
- ✅ Multiple browser tabs ready for testing different scenarios

---

## Phase 1: Basic Functionality Tests

### 1.1 Homepage & Navigation
**Objective:** Verify the landing page loads correctly and navigation works

**Steps:**
1. Open `https://3000-ih9eawtr3k7usgxxstifx-9dcc4d30.manus-asia.computer`
2. Verify homepage displays:
   - ✅ "Find the Best Prices" heading
   - ✅ "AI-Powered Shopping" badge
   - ✅ Three buttons: "Start Searching", "AI Assistant", "My Basket"
3. Click "Start Searching" → Should navigate to `/search`
4. Click "AI Assistant" → Should navigate to `/assistant`
5. Click "My Basket" → Should navigate to `/basket`
6. Use browser back button → Should return to homepage

**Expected Results:**
- All buttons work without errors
- Page transitions are smooth
- No console errors in DevTools

---

### 1.2 Authentication Flow
**Objective:** Test user login and authentication state

**Steps:**
1. Click any "Login" or protected feature button
2. Complete OAuth login flow (Manus OAuth)
3. After login, verify:
   - ✅ User name/email appears in UI
   - ✅ Profile page accessible at `/profile`
   - ✅ Logout button works
4. Open DevTools → Application → Cookies
   - ✅ Verify session cookie exists
5. Logout and verify:
   - ✅ Cookie is cleared
   - ✅ Protected pages redirect to login

**Expected Results:**
- Login flow completes successfully
- User state persists across page refreshes
- Logout clears session properly

---

## Phase 2: Product Search & Discovery

### 2.1 Basic Product Search
**Objective:** Test product search functionality

**Steps:**
1. Navigate to `/search`
2. Enter search query: "iPhone"
3. Click "Search" button
4. Verify results display:
   - ✅ Product cards with images (or placeholders)
   - ✅ Product names
   - ✅ Prices in AED
   - ✅ Platform badges (Amazon, Noon, etc.)
5. Try different queries:
   - "Milk" (grocery item)
   - "Samsung" (electronics)
   - "Laptop" (general term)

**Expected Results:**
- Search returns relevant products
- Products display correctly with all information
- Empty state shows when no results found
- Loading skeleton appears during search

---

### 2.2 Search Filters
**Objective:** Test search filtering options

**Steps:**
1. On search page, apply filters:
   - ✅ Category filter (if available)
   - ✅ Price range slider
   - ✅ Platform checkboxes (Amazon, Noon, Careem, Talabat)
2. Verify results update based on filters
3. Clear filters and verify all results return
4. Combine multiple filters

**Expected Results:**
- Filters work independently and in combination
- Result count updates correctly
- "Clear filters" resets to initial state

---

### 2.3 Semantic Search
**Objective:** Test AI-powered fuzzy product matching

**Steps:**
1. Search for product with variations:
   - "iPhone 15 Pro"
   - "Apple iPhone 15 Pro 256GB"
   - "iphone15pro"
2. Verify all variations return similar products
3. Check that products from different platforms are matched correctly

**Expected Results:**
- Semantic search finds products despite naming differences
- Match confidence is reasonable (>0.6 for similar products)
- Results ranked by relevance

---

## Phase 3: Product Detail & Price Comparison

### 3.1 Product Detail Page
**Objective:** Test individual product page

**Steps:**
1. Click on any product from search results
2. Verify product detail page shows:
   - ✅ Product name
   - ✅ Best price highlighted
   - ✅ Number of platforms available
   - ✅ Price comparison cards sorted by price
3. Check each platform card displays:
   - ✅ Platform name and logo
   - ✅ Price in AED
   - ✅ Availability badge (In Stock / Low Stock / Out of Stock)
   - ✅ Staleness indicator (Fresh / Stale / Expired)
   - ✅ "Add to Basket" button
   - ✅ "View on Platform" external link

**Expected Results:**
- All information displays correctly
- Lowest price is clearly marked
- Platform links open in new tabs
- Staleness indicators are accurate

---

### 3.2 Price Staleness Indicators
**Objective:** Verify price freshness tracking

**Steps:**
1. On product detail page, check staleness badges:
   - 🟢 **Fresh** (<1 hour old) - Green badge with checkmark
   - 🟡 **Stale** (1-24 hours old) - Yellow badge with clock
   - 🔴 **Expired** (>24 hours old) - Red badge with alert icon
2. Verify icon colors match staleness level
3. Hover over badges to see tooltip (if implemented)

**Expected Results:**
- Staleness calculated correctly based on `scrapedAt` timestamp
- Visual indicators are clear and intuitive
- Users understand which prices are most current

---

### 3.3 Price History Chart
**Objective:** Test price trend visualization

**Steps:**
1. Scroll down on product detail page to "Price History" section
2. Verify chart displays:
   - ✅ Line chart with price over time
   - ✅ Different colored lines for each platform
   - ✅ X-axis shows dates
   - ✅ Y-axis shows prices in AED
3. Test time range selector:
   - Click "7D" → Chart updates to show last 7 days
   - Click "30D" → Shows last 30 days
   - Click "90D" → Shows last 90 days
   - Click "All" → Shows all available history
4. Verify price statistics cards:
   - ✅ Lowest Price (green card)
   - ✅ Highest Price (red card)
   - ✅ Average Price (blue card)
   - ✅ Current Price (gray card) with trend arrow
5. Check trend indicator:
   - ↗️ **Up** (red) - Price increased >5%
   - ↘️ **Down** (green) - Price decreased >5%
   - → **Stable** (gray) - Price changed <5%
6. Verify savings tip appears if current price > lowest price

**Expected Results:**
- Chart renders correctly with Recharts
- Time range selector updates data smoothly
- Statistics are calculated accurately
- Trend detection works correctly
- Savings tip shows correct percentage

---

## Phase 4: Basket & Optimization

### 4.1 Add to Basket
**Objective:** Test basket functionality

**Steps:**
1. From product detail page, click "Add to Basket" for a platform
2. Verify toast notification appears: "Added to basket from {Platform}"
3. Navigate to `/basket`
4. Verify basket shows:
   - ✅ Product name
   - ✅ Selected platform
   - ✅ Price
   - ✅ Quantity controls
   - ✅ Remove button

**Expected Results:**
- Items persist in basket
- Basket count updates in navigation
- Can add multiple items from different platforms

---

### 4.2 Basket Optimization
**Objective:** Test AI-powered basket optimization

**Steps:**
1. Add 3-5 products to basket from various platforms
2. Click "Optimize Basket" button
3. Verify optimization results show:
   - ✅ Recommended platform split
   - ✅ Total cost breakdown
   - ✅ Savings compared to single platform
   - ✅ Delivery fee estimates
4. Test with membership toggles:
   - Enable "Amazon Prime" → Verify free delivery applied
   - Enable "Noon One" → Verify discounts applied
   - Enable "Talabat Plus" → Verify benefits applied
5. Compare optimized vs. non-optimized totals

**Expected Results:**
- Optimization algorithm finds cheapest combination
- Membership benefits calculated correctly
- Results update when memberships change
- Savings percentage is accurate

---

### 4.3 Membership Management
**Objective:** Test user membership settings

**Steps:**
1. Navigate to `/profile`
2. Find "Memberships" section
3. Toggle each membership:
   - ✅ Amazon Prime (Free delivery, exclusive deals)
   - ✅ Noon One (10% discount, free delivery)
   - ✅ Talabat Plus (Free delivery, priority support)
4. Save changes
5. Return to basket and verify optimization reflects membership status

**Expected Results:**
- Memberships persist after save
- Basket optimization uses membership benefits
- UI clearly shows which memberships are active

---

## Phase 5: AI Shopping Assistant

### 5.1 Chat Interface
**Objective:** Test conversational AI assistant

**Steps:**
1. Navigate to `/assistant`
2. Verify chat interface displays:
   - ✅ Welcome message
   - ✅ Input field
   - ✅ Send button
3. Send test messages:
   - "Find me keto groceries under 200 AED"
   - "What's the cheapest iPhone?"
   - "Show me milk prices"
4. Verify AI responds with:
   - ✅ Product suggestions
   - ✅ Price comparisons
   - ✅ Platform recommendations

**Expected Results:**
- Chat interface is responsive
- AI provides relevant product suggestions
- Messages display with proper formatting (Markdown)
- Conversation history persists during session

---

### 5.2 Natural Language Understanding
**Objective:** Test AI's ability to parse complex queries

**Steps:**
1. Test various query types:
   - Budget constraints: "Products under 50 AED"
   - Category specific: "Organic vegetables"
   - Brand preference: "Samsung phones"
   - Comparison: "Compare iPhone vs Samsung"
2. Verify AI understands intent and provides relevant results

**Expected Results:**
- AI correctly interprets natural language
- Provides contextual responses
- Suggests follow-up questions

---

## Phase 6: Price Alerts & Notifications

### 6.1 Create Price Alert
**Objective:** Test price alert creation

**Steps:**
1. On product detail page, click "Set Price Alert"
2. Enter target price (e.g., 50 AED)
3. Click "Save Alert"
4. Navigate to `/alerts`
5. Verify alert appears in list:
   - ✅ Product name
   - ✅ Target price
   - ✅ Current price
   - ✅ Status (Active/Triggered)
   - ✅ Delete button

**Expected Results:**
- Alert saves successfully
- Alert list displays all user alerts
- Can delete alerts
- Alert status updates correctly

---

### 6.2 Push Notification Setup
**Objective:** Test browser push notification system

**Steps:**
1. Navigate to `/notifications`
2. Verify page shows:
   - ✅ Permission status indicator
   - ✅ Enable/Disable toggle
   - ✅ Notification type preferences
3. Click "Enable Notifications"
4. Browser prompts for permission → Click "Allow"
5. Verify:
   - ✅ Permission status changes to "Enabled"
   - ✅ Toggle switches to ON
   - ✅ "Send Test Notification" button appears
6. Click "Send Test Notification"
7. Verify notification appears in browser

**Expected Results:**
- Permission request works correctly
- Test notification displays properly
- Notification preferences save
- Status indicators update in real-time

**Note:** Full push notifications require VAPID keys to be configured. Without them, only test notifications (via Notification API) will work.

---

### 6.3 Notification Preferences
**Objective:** Test notification type toggles

**Steps:**
1. On `/notifications` page, find "Notification Types" section
2. Toggle each notification type:
   - ✅ Price Drops
   - ✅ Back in Stock
   - ✅ Price Targets
3. Save preferences
4. Verify settings persist after page refresh

**Expected Results:**
- All toggles work independently
- Preferences save to database
- UI reflects saved state correctly

---

## Phase 7: Admin Dashboard

### 7.1 Scrape Job Monitoring
**Objective:** Test admin scraping dashboard

**Steps:**
1. Login as admin user (owner account)
2. Navigate to `/admin`
3. Verify dashboard shows:
   - ✅ Platform health status
   - ✅ Recent scrape jobs list
   - ✅ Job status (Pending/Running/Success/Failed)
   - ✅ Products scraped count
   - ✅ Error logs
4. Click "Trigger Scrape" for a platform
5. Verify:
   - ✅ New job appears in list
   - ✅ Status updates in real-time
   - ✅ Products scraped count increases

**Expected Results:**
- Admin dashboard accessible only to admin users
- Scrape jobs display with correct status
- Manual scrape trigger works
- Error logs are readable

---

### 7.2 Platform Health
**Objective:** Monitor scraping platform status

**Steps:**
1. On admin dashboard, check "Platform Health" section
2. Verify each platform shows:
   - ✅ Platform name
   - ✅ Last scrape time
   - ✅ Success rate
   - ✅ Active status
3. Check for platforms with errors
4. Review error messages

**Expected Results:**
- Platform health accurately reflects scraping status
- Error messages are helpful for debugging
- Can identify problematic platforms quickly

---

## Phase 8: Performance & UX

### 8.1 Loading States
**Objective:** Verify loading indicators work correctly

**Steps:**
1. On search page, initiate search
2. Verify loading skeleton appears before results
3. Navigate to product detail
4. Verify loading state before page renders
5. Check basket optimization
6. Verify loading spinner during calculation

**Expected Results:**
- Loading states appear immediately
- Skeleton screens match final layout
- No flash of unstyled content
- Smooth transitions between states

---

### 8.2 Empty States
**Objective:** Test empty state handling

**Steps:**
1. Search for non-existent product (e.g., "asdfghjkl")
2. Verify empty state shows helpful message
3. Check empty basket page
4. View alerts page with no alerts
5. Check price history for product with no data

**Expected Results:**
- Empty states are informative
- Suggest next actions to user
- Include relevant icons/illustrations
- No broken UI elements

---

### 8.3 Error Handling
**Objective:** Test error scenarios

**Steps:**
1. Disconnect from internet
2. Try to search → Verify error message appears
3. Reconnect and retry
4. Try invalid product ID: `/product/99999`
5. Verify 404 or error page displays

**Expected Results:**
- Errors display user-friendly messages
- Network errors handled gracefully
- Invalid routes show 404 page
- Console logs helpful debugging info

---

### 8.4 Mobile Responsiveness
**Objective:** Test mobile-first design

**Steps:**
1. Open DevTools → Toggle device toolbar (Ctrl+Shift+M)
2. Test on different screen sizes:
   - 📱 iPhone SE (375px)
   - 📱 iPhone 12 Pro (390px)
   - 📱 iPad (768px)
   - 💻 Desktop (1920px)
3. Verify all pages are readable and functional
4. Check:
   - ✅ Text is legible
   - ✅ Buttons are tappable (min 44px)
   - ✅ Images scale properly
   - ✅ Navigation works on mobile

**Expected Results:**
- All features work on mobile
- No horizontal scrolling
- Touch targets are appropriately sized
- Layout adapts to screen size

---

## Phase 9: Database & Backend

### 9.1 Database Integrity
**Objective:** Verify database operations

**Steps:**
1. Open database UI (if available) or use SQL client
2. Check tables exist:
   - ✅ users
   - ✅ products
   - ✅ rawProducts
   - ✅ priceSnapshots
   - ✅ platforms
   - ✅ userMemberships
   - ✅ priceAlerts
   - ✅ baskets
   - ✅ basketItems
   - ✅ scrapeJobs
   - ✅ categories
   - ✅ searchHistory
   - ✅ productViews
   - ✅ conversations
   - ✅ messages
3. Verify seed data exists (15 products, 41 price variations)
4. Check relationships (foreign keys) are correct

**Expected Results:**
- All tables created successfully
- Seed data populated
- Indexes exist for performance
- No orphaned records

---

### 9.2 API Endpoints (tRPC)
**Objective:** Test backend API procedures

**Steps:**
1. Open browser DevTools → Network tab
2. Perform actions and verify tRPC calls:
   - Search → `products.search`
   - Get prices → `products.getPrices`
   - Add to basket → `baskets.addItem`
   - Optimize basket → `baskets.optimize`
3. Check response status codes (200 = success)
4. Verify response data structure matches expected types

**Expected Results:**
- All API calls return 200 status
- Response data is properly typed
- Errors return meaningful messages
- No CORS or authentication issues

---

## Phase 10: Advanced Features

### 10.1 Semantic Search with Embeddings
**Objective:** Test AI-powered product matching

**Steps:**
1. Use semantic search endpoint via assistant or search
2. Search for products with typos: "iphne 15"
3. Search with different languages (if supported)
4. Verify products are matched despite variations

**Expected Results:**
- Fuzzy matching works correctly
- Match confidence scores are reasonable
- Products from different platforms are linked

**Note:** Requires OpenAI API key to be configured for embeddings generation.

---

### 10.2 Scheduled Jobs
**Objective:** Verify background workers

**Steps:**
1. Check server logs for scheduled job execution:
   - `[Scheduler] Starting scheduled scraping job...`
   - `[Scheduler] Scraped X products from Platform`
2. Verify jobs run at correct intervals:
   - Scraping: Every 6 hours
   - Product matching: 30 min after scraping
   - Data cleanup: Daily at 2 AM
3. Check scrape jobs table for recent entries

**Expected Results:**
- Jobs execute on schedule
- Errors are logged but don't crash server
- Job status updates in database

---

### 10.3 Image Storage (S3)
**Objective:** Test product image handling

**Steps:**
1. Check if products have images
2. Verify images load from S3 (check URL in DevTools)
3. Test image upload (if admin feature exists)
4. Verify placeholder images for missing products

**Expected Results:**
- Images load quickly from CDN
- Fallback images work correctly
- Image optimization (WebP, thumbnails) applied

**Note:** Requires S3 credentials to be configured.

---

## Phase 11: Security & Privacy

### 11.1 Authentication Security
**Objective:** Test auth security measures

**Steps:**
1. Try accessing protected routes without login
2. Verify redirect to login page
3. Check session cookie is HttpOnly and Secure
4. Test session expiration (wait or manually delete cookie)
5. Verify logout clears all auth state

**Expected Results:**
- Protected routes require authentication
- Session cookies are secure
- No sensitive data in localStorage
- CSRF protection in place

---

### 11.2 Data Privacy
**Objective:** Verify user data handling

**Steps:**
1. Create account and add personal data
2. Verify data is stored securely
3. Check that user data is isolated (can't see other users' baskets)
4. Test data deletion (if feature exists)

**Expected Results:**
- User data is properly scoped
- No data leakage between users
- Sensitive data is encrypted
- GDPR compliance (if applicable)

---

## Phase 12: Integration Tests

### 12.1 End-to-End User Flow
**Objective:** Test complete user journey

**Steps:**
1. **Discovery:**
   - Open homepage
   - Search for "iPhone"
   - View product details
2. **Comparison:**
   - Check price history
   - Compare platforms
   - Note best price
3. **Purchase Decision:**
   - Add to basket
   - Add more products
   - Optimize basket
4. **Checkout:**
   - Click "View on Platform" for best option
   - Verify deep link works
5. **Follow-up:**
   - Set price alert
   - Enable notifications
   - Chat with AI assistant for recommendations

**Expected Results:**
- Entire flow works smoothly
- No errors or broken links
- User can complete purchase journey
- All features integrate seamlessly

---

## Phase 13: Automated Tests

### 13.1 Unit Tests
**Objective:** Run automated test suite

**Steps:**
1. Run `pnpm test` in terminal
2. Verify all tests pass:
   - ✅ auth.logout.test.ts (1 test)
   - ✅ basketOptimizer.test.ts (5 tests)
   - ✅ db.test.ts (6 tests)
   - ✅ embeddings.test.ts (25 tests)
3. Check test coverage report
4. Review any failing tests

**Expected Results:**
- All 37 tests pass
- No TypeScript errors
- Test coverage >80% (if measured)
- Tests run in <5 seconds

---

### 13.2 TypeScript Type Checking
**Objective:** Verify type safety

**Steps:**
1. Run `pnpm check` (or `tsc --noEmit`)
2. Verify no TypeScript errors
3. Check for any `@ts-ignore` comments (should be minimal)
4. Review type definitions in `drizzle/schema.ts`

**Expected Results:**
- Zero TypeScript errors
- Proper type inference throughout codebase
- No `any` types in critical paths
- Schema types match database

---

## Phase 14: Performance Testing

### 14.1 Page Load Speed
**Objective:** Measure performance metrics

**Steps:**
1. Open DevTools → Lighthouse tab
2. Run audit on key pages:
   - Homepage
   - Search page
   - Product detail
3. Check metrics:
   - ✅ First Contentful Paint <1.8s
   - ✅ Largest Contentful Paint <2.5s
   - ✅ Time to Interactive <3.8s
   - ✅ Cumulative Layout Shift <0.1
4. Review performance suggestions

**Expected Results:**
- Performance score >90
- All Core Web Vitals in green
- No render-blocking resources
- Images optimized

---

### 14.2 Database Query Performance
**Objective:** Test query efficiency

**Steps:**
1. Enable database query logging
2. Perform common operations:
   - Search products
   - Get price history
   - Optimize basket
3. Check query execution times in logs
4. Verify indexes are being used

**Expected Results:**
- Most queries <100ms
- Complex queries <500ms
- No N+1 query problems
- Indexes utilized correctly

---

## Phase 15: Browser Compatibility

### 15.1 Cross-Browser Testing
**Objective:** Verify compatibility across browsers

**Test Matrix:**
| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ |
| Firefox | Latest | ✅ |
| Safari | Latest | ✅ |
| Edge | Latest | ✅ |
| Mobile Safari | iOS 15+ | ✅ |
| Chrome Mobile | Android 10+ | ✅ |

**Steps:**
1. Test core functionality in each browser
2. Check for visual inconsistencies
3. Verify all interactive elements work
4. Test push notifications (not supported in all browsers)

**Expected Results:**
- Core features work in all modern browsers
- Graceful degradation for unsupported features
- Consistent visual appearance
- No browser-specific bugs

---

## Phase 16: Accessibility (A11y)

### 16.1 Keyboard Navigation
**Objective:** Test keyboard-only navigation

**Steps:**
1. Navigate site using only keyboard:
   - Tab through interactive elements
   - Use Enter/Space to activate buttons
   - Use Arrow keys in dropdowns
2. Verify focus indicators are visible
3. Check tab order is logical
4. Test Escape key to close modals

**Expected Results:**
- All interactive elements are keyboard accessible
- Focus indicators are clear
- Tab order follows visual layout
- No keyboard traps

---

### 16.2 Screen Reader Testing
**Objective:** Verify screen reader compatibility

**Steps:**
1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Navigate through key pages
3. Verify:
   - ✅ Images have alt text
   - ✅ Buttons have descriptive labels
   - ✅ Form inputs have labels
   - ✅ Headings are properly structured (h1, h2, h3)
4. Test ARIA labels and roles

**Expected Results:**
- All content is announced correctly
- Navigation is logical
- Interactive elements are clearly identified
- No missing or incorrect labels

---

### 16.3 Color Contrast
**Objective:** Verify WCAG compliance

**Steps:**
1. Use browser extension (e.g., axe DevTools)
2. Run accessibility audit
3. Check color contrast ratios:
   - Normal text: ≥4.5:1
   - Large text: ≥3:1
4. Test with color blindness simulators

**Expected Results:**
- All text meets contrast requirements
- Color is not the only indicator
- UI is usable with color blindness
- No accessibility violations

---

## Troubleshooting Guide

### Common Issues

**Issue:** Search returns no results
- **Solution:** Check if database is seeded. Run seed script: `node scripts/seed.mjs`

**Issue:** Price history chart not showing
- **Solution:** Verify price snapshots exist in database for the product

**Issue:** Push notifications not working
- **Solution:** Generate VAPID keys: `npx web-push generate-vapid-keys` and add to env

**Issue:** Scraper fails with timeout
- **Solution:** Check network connection and platform availability. Increase timeout in scraper config.

**Issue:** Basket optimization gives unexpected results
- **Solution:** Verify membership settings are correct. Check delivery fee calculations.

**Issue:** Images not loading
- **Solution:** Check S3 credentials. Verify storagePut function is working. Use placeholder images.

---

## Test Data Reference

### Seeded Products (15 total)
1. iPhone 15 Pro Max 256GB (Electronics)
2. Samsung Galaxy S24 Ultra (Electronics)
3. MacBook Pro M3 (Electronics)
4. Sony WH-1000XM5 Headphones (Electronics)
5. Almarai Fresh Milk 1L (Groceries)
6. Organic Bananas 1kg (Groceries)
7. Whole Wheat Bread (Groceries)
8. Chicken Breast 1kg (Groceries)
9. Nike Air Max Shoes (Fashion)
10. Adidas Running Shoes (Fashion)
11. Levi's Jeans (Fashion)
12. Cotton T-Shirt (Fashion)
13. Pampers Diapers Size 4 (Baby)
14. Baby Formula 400g (Baby)
15. Baby Wipes 80ct (Baby)

### Test User Accounts
- **Admin:** Owner account (auto-assigned based on OWNER_OPEN_ID)
- **Regular User:** Any OAuth login

### Test Platforms
1. Amazon UAE
2. Noon
3. Talabat
4. Careem

---

## Success Criteria

### Must Pass (Critical)
- ✅ All 37 unit tests pass
- ✅ Zero TypeScript errors
- ✅ Authentication works correctly
- ✅ Product search returns results
- ✅ Price comparison displays accurately
- ✅ Basket optimization calculates correctly
- ✅ No critical console errors

### Should Pass (Important)
- ✅ Price history charts render
- ✅ Push notification setup works
- ✅ AI assistant responds
- ✅ Mobile responsive design
- ✅ Loading states appear
- ✅ Error handling works

### Nice to Have (Enhancement)
- ✅ Live scrapers work with real sites
- ✅ Semantic search with embeddings
- ✅ S3 image storage functional
- ✅ Scheduled jobs running
- ✅ Performance score >90

---

## Reporting Issues

When reporting bugs, include:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Browser/device info**
5. **Console errors** (screenshot)
6. **Network tab** (if API issue)

---

## Next Steps After Testing

Once testing is complete:
1. ✅ Document all bugs found
2. ✅ Prioritize fixes (Critical → High → Medium → Low)
3. ✅ Create GitHub issues for each bug
4. ✅ Fix critical bugs before deployment
5. ✅ Re-test after fixes
6. ✅ Prepare for production deployment

---

**Last Updated:** January 2026
**Version:** 1.0
**Status:** Ready for Testing
