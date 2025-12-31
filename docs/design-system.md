# PriceGenie Design System

## Design Philosophy

**Aesthetic Direction**: Modern Arabic-Futurism meets Confident Minimalism

PriceGenie's design language draws inspiration from:
- The geometric precision of Islamic art patterns
- Dubai's sleek, futuristic architecture
- The confidence of luxury e-commerce (Farfetch, Net-a-Porter)
- The clarity of fintech apps (Wise, Revolut)

**Core Principle**: "Effortless Savings" - The UI should feel like having a brilliant friend who always knows where to find the best deals.

---

## Color Palette

### Primary Colors

```css
:root {
  /* ═══════════════════════════════════════════════════════════════
     PRIMARY: Deep Teal - Trust, Intelligence, GCC Ocean Reference
     ═══════════════════════════════════════════════════════════════ */
  --color-primary-50:  #E6FAF7;
  --color-primary-100: #B3F0E8;
  --color-primary-200: #80E6D9;
  --color-primary-300: #4DDCCA;
  --color-primary-400: #26D4BE;
  --color-primary-500: #00C9A7;  /* Main Brand Color */
  --color-primary-600: #00A88C;
  --color-primary-700: #008771;
  --color-primary-800: #006656;
  --color-primary-900: #00453B;
  
  /* ═══════════════════════════════════════════════════════════════
     SECONDARY: Warm Gold - Luxury, Savings, Arabian Heritage
     ═══════════════════════════════════════════════════════════════ */
  --color-gold-50:  #FFF9E6;
  --color-gold-100: #FFEDB3;
  --color-gold-200: #FFE180;
  --color-gold-300: #FFD54D;
  --color-gold-400: #FFCC26;
  --color-gold-500: #FFC107;  /* Accent for Savings/Deals */
  --color-gold-600: #DBA506;
  --color-gold-700: #B78A05;
  --color-gold-800: #936F04;
  --color-gold-900: #6F5403;
  
  /* ═══════════════════════════════════════════════════════════════
     ACCENT: Electric Coral - Energy, Urgency, CTAs
     ═══════════════════════════════════════════════════════════════ */
  --color-coral-50:  #FFF0ED;
  --color-coral-100: #FFD4CC;
  --color-coral-200: #FFB8AB;
  --color-coral-300: #FF9C8A;
  --color-coral-400: #FF8069;
  --color-coral-500: #FF6B6B;  /* Action Buttons, Alerts */
  --color-coral-600: #E55A5A;
  --color-coral-700: #CC4949;
  --color-coral-800: #B23838;
  --color-coral-900: #992727;
}
```

### Semantic Colors

```css
:root {
  /* Status Colors */
  --color-success:    #10B981;  /* Fresh prices, In Stock */
  --color-warning:    #F59E0B;  /* Stale prices, Low Stock */
  --color-error:      #EF4444;  /* Expired, Out of Stock */
  --color-info:       #3B82F6;  /* Informational states */
  
  /* Best Price Indicator - Gradient */
  --gradient-best-price: linear-gradient(135deg, #00C9A7 0%, #00A88C 50%, #FFC107 100%);
  
  /* Savings Badge */
  --gradient-savings: linear-gradient(90deg, #FFC107 0%, #FFD54D 100%);
}
```

### Neutral Palette (Dark Mode First)

```css
:root {
  /* Dark Theme (Default) */
  --color-bg-primary:    #0A0A0B;   /* App background */
  --color-bg-secondary:  #141416;   /* Cards, modals */
  --color-bg-tertiary:   #1E1E22;   /* Elevated surfaces */
  --color-bg-hover:      #2A2A30;   /* Interactive hover */
  
  --color-border:        #2E2E35;   /* Subtle borders */
  --color-border-focus:  #00C9A7;   /* Focus rings */
  
  --color-text-primary:  #FFFFFF;   /* Headlines */
  --color-text-secondary:#A1A1AA;   /* Body text */
  --color-text-tertiary: #71717A;   /* Captions, hints */
  --color-text-inverse:  #0A0A0B;   /* Text on light bg */
}

/* Light Theme Override */
[data-theme="light"] {
  --color-bg-primary:    #FAFAFA;
  --color-bg-secondary:  #FFFFFF;
  --color-bg-tertiary:   #F4F4F5;
  --color-bg-hover:      #E4E4E7;
  
  --color-border:        #E4E4E7;
  
  --color-text-primary:  #18181B;
  --color-text-secondary:#52525B;
  --color-text-tertiary: #A1A1AA;
}
```

### Platform Brand Colors

```css
:root {
  /* Platform identification colors */
  --color-amazon:    #FF9900;
  --color-noon:      #FEEE00;
  --color-talabat:   #FF5A00;
  --color-careem:    #4AA577;
  --color-carrefour: #004E9A;
}
```

---

## Typography

### Font Stack

```css
:root {
  /* ═══════════════════════════════════════════════════════════════
     DISPLAY: Clash Display - Bold, Modern, Geometric
     https://www.fontshare.com/fonts/clash-display
     ═══════════════════════════════════════════════════════════════ */
  --font-display: 'Clash Display', 'SF Pro Display', system-ui, sans-serif;
  
  /* ═══════════════════════════════════════════════════════════════
     BODY: Satoshi - Clean, Readable, Contemporary
     https://www.fontshare.com/fonts/satoshi
     ═══════════════════════════════════════════════════════════════ */
  --font-body: 'Satoshi', 'SF Pro Text', system-ui, sans-serif;
  
  /* ═══════════════════════════════════════════════════════════════
     ARABIC: IBM Plex Arabic - Modern, Bilingual Harmony
     https://fonts.google.com/specimen/IBM+Plex+Sans+Arabic
     ═══════════════════════════════════════════════════════════════ */
  --font-arabic: 'IBM Plex Sans Arabic', 'Satoshi', system-ui, sans-serif;
  
  /* ═══════════════════════════════════════════════════════════════
     MONO: JetBrains Mono - Prices, Data, Technical
     ═══════════════════════════════════════════════════════════════ */
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
}
```

### Type Scale

```css
:root {
  /* Modular scale: 1.25 (Major Third) */
  --text-xs:   0.75rem;    /* 12px - Captions, badges */
  --text-sm:   0.875rem;   /* 14px - Secondary text */
  --text-base: 1rem;       /* 16px - Body text */
  --text-lg:   1.125rem;   /* 18px - Lead paragraphs */
  --text-xl:   1.25rem;    /* 20px - Card titles */
  --text-2xl:  1.5rem;     /* 24px - Section headers */
  --text-3xl:  1.875rem;   /* 30px - Page titles */
  --text-4xl:  2.25rem;    /* 36px - Hero headlines */
  --text-5xl:  3rem;       /* 48px - Marketing headlines */
  --text-6xl:  3.75rem;    /* 60px - Splash screens */
  
  /* Font weights */
  --font-regular:  400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;
  
  /* Line heights */
  --leading-none:   1;
  --leading-tight:  1.25;
  --leading-snug:   1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  
  /* Letter spacing */
  --tracking-tighter: -0.05em;
  --tracking-tight:   -0.025em;
  --tracking-normal:  0;
  --tracking-wide:    0.025em;
}
```

### Typography Styles

```css
/* Display Headlines - Clash Display */
.text-display-xl {
  font-family: var(--font-display);
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tighter);
}

/* Page Title */
.text-title {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
}

/* Card Title */
.text-heading {
  font-family: var(--font-body);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
}

/* Body Text */
.text-body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-regular);
  line-height: var(--leading-normal);
  color: var(--color-text-secondary);
}

/* Price Display - Prominent */
.text-price {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  letter-spacing: var(--tracking-tight);
  font-variant-numeric: tabular-nums;
}

/* Price Display - Secondary (strikethrough) */
.text-price-original {
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  font-weight: var(--font-regular);
  color: var(--color-text-tertiary);
  text-decoration: line-through;
}

/* Savings Badge */
.text-savings {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}
```

---

## Spacing & Layout

```css
:root {
  /* Spacing scale (4px base) */
  --space-0:  0;
  --space-1:  0.25rem;   /* 4px */
  --space-2:  0.5rem;    /* 8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  
  /* Border radius */
  --radius-sm:   0.375rem;  /* 6px - Buttons, badges */
  --radius-md:   0.5rem;    /* 8px - Inputs */
  --radius-lg:   0.75rem;   /* 12px - Cards */
  --radius-xl:   1rem;      /* 16px - Modals */
  --radius-2xl:  1.5rem;    /* 24px - Bottom sheets */
  --radius-full: 9999px;    /* Pills, avatars */
  
  /* Shadows - Dark mode optimized */
  --shadow-sm:  0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md:  0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4);
  --shadow-lg:  0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5);
  --shadow-xl:  0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
  
  /* Glow effects for primary elements */
  --glow-primary: 0 0 20px rgba(0, 201, 167, 0.3);
  --glow-gold:    0 0 20px rgba(255, 193, 7, 0.3);
}
```

---

## Animation System

### Timing & Easing

```css
:root {
  /* ═══════════════════════════════════════════════════════════════
     DURATIONS - Based on human perception thresholds
     ═══════════════════════════════════════════════════════════════ */
  --duration-instant:  75ms;    /* Immediate feedback */
  --duration-fast:     150ms;   /* Quick interactions */
  --duration-normal:   250ms;   /* Standard transitions */
  --duration-slow:     400ms;   /* Complex animations */
  --duration-slower:   600ms;   /* Page transitions */
  --duration-slowest:  1000ms;  /* Dramatic reveals */
  
  /* ═══════════════════════════════════════════════════════════════
     EASING CURVES - Expressive motion
     ═══════════════════════════════════════════════════════════════ */
  
  /* Standard - Natural deceleration */
  --ease-out:      cubic-bezier(0.16, 1, 0.3, 1);
  
  /* Snappy - Quick start, smooth end */
  --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
  
  /* Bouncy - Playful overshoot */
  --ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
  
  /* Elastic - Spring physics */
  --ease-elastic:  cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Smooth - Subtle, refined */
  --ease-smooth:   cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Enter - Elements appearing */
  --ease-enter:    cubic-bezier(0, 0, 0.2, 1);
  
  /* Exit - Elements leaving */
  --ease-exit:     cubic-bezier(0.4, 0, 1, 1);
}
```

### Core Animations

```css
/* ═══════════════════════════════════════════════════════════════
   FADE IN UP - Primary entrance animation
   ═══════════════════════════════════════════════════════════════ */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp var(--duration-normal) var(--ease-out) forwards;
}

/* ═══════════════════════════════════════════════════════════════
   SCALE IN - For modals, popovers
   ═══════════════════════════════════════════════════════════════ */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scaleIn var(--duration-fast) var(--ease-out-back) forwards;
}

/* ═══════════════════════════════════════════════════════════════
   SLIDE IN FROM RIGHT - Page transitions
   ═══════════════════════════════════════════════════════════════ */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in-right {
  animation: slideInRight var(--duration-slow) var(--ease-out-expo) forwards;
}

/* ═══════════════════════════════════════════════════════════════
   SHIMMER - Loading skeleton
   ═══════════════════════════════════════════════════════════════ */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 0%,
    var(--color-bg-tertiary) 50%,
    var(--color-bg-secondary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

/* ═══════════════════════════════════════════════════════════════
   PULSE GLOW - Best Price indicator
   ═══════════════════════════════════════════════════════════════ */
@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(0, 201, 167, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(0, 201, 167, 0);
  }
}

.animate-pulse-glow {
  animation: pulseGlow 2s var(--ease-smooth) infinite;
}

/* ═══════════════════════════════════════════════════════════════
   SAVINGS REVEAL - Number counting animation
   ═══════════════════════════════════════════════════════════════ */
@keyframes countUp {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-count-up {
  animation: countUp var(--duration-slow) var(--ease-out-back) forwards;
}

/* ═══════════════════════════════════════════════════════════════
   CONFETTI BURST - Success celebration
   ═══════════════════════════════════════════════════════════════ */
@keyframes confettiBurst {
  0% {
    opacity: 1;
    transform: translateY(0) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translateY(-100px) rotate(720deg);
  }
}

/* ═══════════════════════════════════════════════════════════════
   STAGGER CHILDREN - List entrance
   ═══════════════════════════════════════════════════════════════ */
.stagger-children > * {
  opacity: 0;
  animation: fadeInUp var(--duration-normal) var(--ease-out) forwards;
}

.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
.stagger-children > *:nth-child(3) { animation-delay: 100ms; }
.stagger-children > *:nth-child(4) { animation-delay: 150ms; }
.stagger-children > *:nth-child(5) { animation-delay: 200ms; }
.stagger-children > *:nth-child(6) { animation-delay: 250ms; }
.stagger-children > *:nth-child(7) { animation-delay: 300ms; }
.stagger-children > *:nth-child(8) { animation-delay: 350ms; }
```

### Micro-Interactions

```css
/* ═══════════════════════════════════════════════════════════════
   BUTTON PRESS - Haptic-like feedback
   ═══════════════════════════════════════════════════════════════ */
.btn-press {
  transition: transform var(--duration-instant) var(--ease-out);
}

.btn-press:active {
  transform: scale(0.97);
}

/* ═══════════════════════════════════════════════════════════════
   CARD HOVER - Subtle lift
   ═══════════════════════════════════════════════════════════════ */
.card-hover {
  transition: 
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* ═══════════════════════════════════════════════════════════════
   PLATFORM LOGO HOVER - Brand reveal
   ═══════════════════════════════════════════════════════════════ */
.platform-logo {
  transition: 
    filter var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
  filter: grayscale(100%);
}

.platform-logo:hover {
  filter: grayscale(0%);
  transform: scale(1.05);
}

/* ═══════════════════════════════════════════════════════════════
   PRICE UPDATE - Flash attention
   ═══════════════════════════════════════════════════════════════ */
@keyframes priceFlash {
  0%, 100% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(0, 201, 167, 0.2);
  }
}

.price-updated {
  animation: priceFlash var(--duration-slow) var(--ease-smooth);
}

/* ═══════════════════════════════════════════════════════════════
   ADD TO BASKET - Satisfying bounce
   ═══════════════════════════════════════════════════════════════ */
@keyframes addToBounce {
  0% { transform: scale(1); }
  30% { transform: scale(1.2); }
  50% { transform: scale(0.9); }
  70% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.animate-add-bounce {
  animation: addToBounce var(--duration-slow) var(--ease-elastic);
}

/* ═══════════════════════════════════════════════════════════════
   TOGGLE SWITCH - Smooth slide
   ═══════════════════════════════════════════════════════════════ */
.toggle-knob {
  transition: transform var(--duration-fast) var(--ease-out-back);
}

.toggle-active .toggle-knob {
  transform: translateX(100%);
}
```

### Page Transition Patterns

```css
/* ═══════════════════════════════════════════════════════════════
   SHARED ELEMENT TRANSITION - Product card to detail
   ═══════════════════════════════════════════════════════════════ */
.shared-element {
  view-transition-name: product-image;
}

::view-transition-old(product-image),
::view-transition-new(product-image) {
  animation-duration: var(--duration-slow);
  animation-timing-function: var(--ease-out-expo);
}

/* ═══════════════════════════════════════════════════════════════
   BOTTOM SHEET - Mobile patterns
   ═══════════════════════════════════════════════════════════════ */
@keyframes slideUpSheet {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.bottom-sheet-enter {
  animation: slideUpSheet var(--duration-slow) var(--ease-out-expo) forwards;
}

.bottom-sheet-backdrop {
  animation: fadeIn var(--duration-normal) var(--ease-smooth) forwards;
}
```

---

## Component Examples

### Price Comparison Card

```jsx
// React Native / Expo example
import { MotiView } from 'moti';

const PriceCard = ({ product, index }) => (
  <MotiView
    from={{ opacity: 0, translateY: 20 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{
      type: 'timing',
      duration: 250,
      delay: index * 50,
    }}
    style={styles.card}
  >
    <View style={styles.header}>
      <Text style={styles.productName}>{product.name}</Text>
      {product.isBestPrice && (
        <MotiView
          from={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10 }}
          style={styles.bestPriceBadge}
        >
          <Text style={styles.badgeText}>BEST PRICE</Text>
        </MotiView>
      )}
    </View>
    
    <View style={styles.priceList}>
      {product.prices.map((price, i) => (
        <PlatformPrice 
          key={price.platformId} 
          price={price}
          delay={100 + (i * 75)}
        />
      ))}
    </View>
  </MotiView>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141416',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2E2E35',
  },
  productName: {
    fontFamily: 'Satoshi-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  bestPriceBadge: {
    backgroundColor: '#00C9A7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 10,
    color: '#0A0A0B',
    letterSpacing: 0.5,
  },
});
```

### Savings Counter Animation

```jsx
// Animated savings reveal
import { useEffect, useState } from 'react';
import { MotiText } from 'moti';

const SavingsCounter = ({ targetValue, duration = 1000 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(eased * targetValue));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [targetValue]);
  
  return (
    <MotiText
      from={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 15 }}
      style={styles.savingsText}
    >
      Save AED {displayValue.toLocaleString()}
    </MotiText>
  );
};
```

---

## Iconography

**Primary Icon Set**: Lucide Icons (clean, consistent stroke width)

**Custom Icons Needed**:
- Platform logos (Amazon, Noon, Talabat, Careem, Carrefour)
- PriceGenie mascot/logo (geometric genie lamp with price tag)
- Savings sparkle
- Basket optimization indicator

**Icon Sizes**:
```css
--icon-xs: 14px;   /* Inline text */
--icon-sm: 18px;   /* Buttons */
--icon-md: 24px;   /* Navigation */
--icon-lg: 32px;   /* Empty states */
--icon-xl: 48px;   /* Onboarding */
```

---

## Accessibility

- Minimum touch target: 44×44px
- Color contrast: WCAG AA minimum (4.5:1 for text)
- Focus indicators: 2px solid var(--color-primary-500)
- Reduced motion: Respect `prefers-reduced-motion`
- RTL support: Full Arabic layout support

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Responsive Breakpoints

```css
:root {
  --breakpoint-sm:  640px;   /* Mobile landscape */
  --breakpoint-md:  768px;   /* Tablet portrait */
  --breakpoint-lg:  1024px;  /* Tablet landscape */
  --breakpoint-xl:  1280px;  /* Desktop */
  --breakpoint-2xl: 1536px;  /* Large desktop */
}
```
