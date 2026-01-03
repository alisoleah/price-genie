# PriceGenie Quick Testing Guide

## 🎯 Phase 1: Homepage & Navigation (5 minutes)

### Test Homepage
1. ✅ **Check homepage loads** - You should see "Find the Best Prices" heading
2. ✅ **Verify navigation** - Top header shows: Home, Search, AI Assistant, Basket, Alerts
3. ✅ **Test login** - Click the user icon (top-right) → Should show your profile dropdown
4. ✅ **Check profile dropdown** - Should show: Profile, Notifications, Admin Dashboard (you're admin), Logout

### Test Navigation Links
1. Click **"Start Searching"** button → Should go to Search page
2. Click **"AI Assistant"** button → Should go to AI chat interface
3. Click **"My Basket"** button → Should go to Basket page
4. Click **PriceGenie logo** → Should return to homepage

**Expected Result:** All navigation works smoothly, no broken links

---

## 🔍 Phase 2: Product Search (10 minutes)

### Test Basic Search
1. Go to **Search page** (click "Start Searching")
2. Try searching for: **"iPhone"**
   - ✅ Should show toast: "Searching for iPhone..."
   - ✅ Should display product cards with images, prices, platforms
3. Try searching with **1 character** (e.g., "a")
   - ✅ Should show error toast: "Please enter at least 2 characters"

### Test Seeded Products
Search for these to see real data:
- **"iPhone"** - Should find iPhone 13 Pro Max
- **"MacBook"** - Should find MacBook Air M2
- **"AirPods"** - Should find AirPods Pro
- **"milk"** - Should find Almarai Fresh Milk
- **"eggs"** - Should find Organic Eggs

### Check Product Cards
Each product card should show:
- ✅ Product image (or placeholder)
- ✅ Product name
- ✅ Price with AED currency
- ✅ Platform badge (Amazon/Noon/Talabat/Careem) with correct color
- ✅ Staleness indicator (Fresh/Stale/Expired)
- ✅ "View Details" button

**Expected Result:** Search works, products display correctly, toast notifications appear

---

## 🛒 Phase 3: Basket & Optimization (10 minutes)

### Test Basket
1. Go to **Basket page** (top navigation)
2. You should see 3 mock items:
   - iPhone 13 Pro Max
   - Almarai Fresh Milk (x2)
   - Organic Eggs
3. Click **"Optimize Basket"** button
   - ✅ Should show loading state
   - ✅ Should display optimization results with platform split
   - ✅ Should show total savings
   - ✅ Toast notification: "Basket optimized!"

### Check Optimization Results
After optimization, verify:
- ✅ Shows which platform to buy each item from
- ✅ Shows total cost per platform
- ✅ Shows total savings amount
- ✅ Shows "Checkout" buttons with deep links

**Expected Result:** Basket optimization works and shows cost breakdown

---

## 👤 Phase 4: Profile & Memberships (5 minutes)

### Test Profile Page
1. Click **user icon** (top-right) → **Profile**
2. Should display:
   - ✅ Your name and email
   - ✅ Account created date
   - ✅ Membership toggles for: Amazon Prime, Noon One, Talabat Plus, Careem Plus

### Test Membership Toggles
1. **Turn ON** Amazon Prime
   - ✅ Toast: "Membership updated"
   - ✅ Toggle should turn green
2. **Turn OFF** Amazon Prime
   - ✅ Toast: "Membership removed"
   - ✅ Toggle should turn gray

**Expected Result:** Memberships can be toggled, toast notifications appear

---

## 🤖 Phase 5: AI Assistant (5 minutes)

### Test AI Chat
1. Go to **AI Assistant** page (top navigation)
2. Try asking: **"Find me the cheapest iPhone"**
   - ✅ Should show your message
   - ✅ Should show AI response with product recommendations
3. Try: **"What's the best deal on groceries?"**
   - ✅ Should provide relevant suggestions

**Expected Result:** AI assistant responds to queries

---

## 🔔 Phase 6: Price Alerts (5 minutes)

### Test Alerts Page
1. Go to **Alerts** page (top navigation)
2. Click **"Create Alert"** button
3. Fill in:
   - Product ID: 1 (iPhone)
   - Target Price: 3000 AED
4. Click **"Create Alert"**
   - ✅ Toast: "Alert created"
   - ✅ Alert appears in list

### Test Alert Management
1. Click **"Delete"** on an alert
   - ✅ Toast: "Alert deleted"
   - ✅ Alert removed from list

**Expected Result:** Alerts can be created and deleted

---

## ⚙️ Phase 7: Admin Dashboard (Admin Only) (10 minutes)

### Test Admin Access
1. Click **user icon** → **Admin Dashboard**
2. Should see:
   - ✅ Platform health status (Amazon, Noon, Talabat, Careem)
   - ✅ Recent scrape jobs table
   - ✅ "Trigger Manual Scrape" button

### Test Manual Scrape
1. Click **"Trigger Manual Scrape"**
2. Select a platform (e.g., Amazon)
3. Click **"Start Scrape"**
   - ✅ Should create a new scrape job
   - ✅ Job should appear in the table
   - ✅ Status should show "pending" or "running"

**Expected Result:** Admin can monitor and trigger scrapes

---

## 📱 Phase 8: PWA & Mobile (5 minutes)

### Test PWA Installation
1. **On Chrome/Edge:** Look for install icon in address bar
2. Click **"Install PriceGenie"**
   - ✅ App should install as standalone app
3. Open installed app
   - ✅ Should work without browser UI
   - ✅ Should have app icon

### Test Offline Mode
1. Open DevTools → Network tab
2. Set to **"Offline"**
3. Navigate to different pages
   - ✅ Previously visited pages should load from cache
   - ✅ API requests should show offline error

**Expected Result:** PWA installs and works offline

---

## 🎨 Phase 9: UI/UX Polish (5 minutes)

### Check Design Elements
1. ✅ **Animations** - Smooth page transitions
2. ✅ **Loading states** - Skeleton loaders while fetching data
3. ✅ **Empty states** - Friendly messages when no data
4. ✅ **Hover effects** - Buttons and cards respond to hover
5. ✅ **Mobile responsive** - Resize browser to mobile width

### Test Toast Notifications
Throughout testing, verify toasts appear for:
- ✅ Search validation errors
- ✅ Basket optimization success/failure
- ✅ Membership updates
- ✅ Alert creation/deletion
- ✅ Logout confirmation

**Expected Result:** UI is polished and responsive

---

## ✅ Testing Checklist Summary

- [ ] Homepage loads correctly
- [ ] Navigation works (all links)
- [ ] Search finds products
- [ ] Product cards display properly
- [ ] Basket optimization works
- [ ] Memberships can be toggled
- [ ] AI Assistant responds
- [ ] Price alerts can be created/deleted
- [ ] Admin dashboard accessible
- [ ] Manual scrape can be triggered
- [ ] PWA can be installed
- [ ] Offline mode works
- [ ] Toast notifications appear
- [ ] Mobile responsive

---

## 🐛 Found Issues?

If you find any bugs or issues during testing:

1. **Note the page** where the error occurred
2. **Describe what you did** (steps to reproduce)
3. **What happened** vs. **what you expected**
4. **Share the error message** (if any)

I'll fix any issues you discover!

---

## 🎉 Next Steps After Testing

Once testing is complete, we'll continue with:
1. **Saved Baskets** - Persist baskets across sessions
2. **Search History** - Track and suggest previous searches
3. **Platform Availability** - Show stock status (in stock, low stock, out of stock)
4. **Live Scraper Testing** - Connect to real UAE e-commerce platforms
