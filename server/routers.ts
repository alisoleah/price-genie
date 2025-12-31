import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { semanticSearch, processUnmatchedProducts } from "./productMatcher";
import * as db from "./db";
import { optimizeBasket, generateDeepLink } from "./basketOptimizer";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Platform operations
  platforms: router({
    list: publicProcedure.query(async () => {
      return db.getAllPlatforms();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getPlatformById(input.id);
      }),
  }),

  // Product search and price comparison
  products: router({
    search: publicProcedure
      .input(z.object({
        query: z.string(),
        category: z.string().optional(),
        brand: z.string().optional(),
        platformIds: z.array(z.number()).optional(),
        maxPrice: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const products = await db.searchProducts(input.query, {
          category: input.category,
          brand: input.brand,
          platformIds: input.platformIds,
          maxPrice: input.maxPrice,
        });
        
        return products;
      }),

    getPrices: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        const prices = await db.getProductPrices(input.productId);
        
        // Add staleness indicator
        return prices.map(price => ({
          ...price,
          staleness: db.calculateStaleness(price.scrapedAt),
          priceInAED: price.price / 100, // Convert fils to AED
        }));
      }),

    semanticSearch: publicProcedure
      .input(z.object({
        query: z.string(),
        limit: z.number().min(1).max(50).default(10),
      }))
      .query(async ({ input }) => {
        const results = await semanticSearch(input.query, input.limit);
        return results;
      }),
  }),

  // User membership management
  memberships: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserMemberships(ctx.user.id);
    }),

    upsert: protectedProcedure
      .input(z.object({
        platformId: z.number(),
        membershipType: z.string(),
        discountPercent: z.number().min(0).max(100).optional(),
        freeShipping: z.boolean().optional(),
        expiresAt: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertUserMembership({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ platformId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteUserMembership(ctx.user.id, input.platformId);
        return { success: true };
      }),
  }),

  // Basket operations
  baskets: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserBaskets(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ basketId: z.number() }))
      .query(async ({ input }) => {
        return db.getBasketWithItems(input.basketId);
      }),

    create: protectedProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const basketId = await db.createBasket(ctx.user.id, input.name);
        return { basketId };
      }),

    addItem: protectedProcedure
      .input(z.object({
        basketId: z.number(),
        productId: z.number(),
        quantity: z.number().min(1),
      }))
      .mutation(async ({ input }) => {
        await db.addBasketItem(input.basketId, input.productId, input.quantity);
        return { success: true };
      }),

    removeItem: protectedProcedure
      .input(z.object({ itemId: z.number() }))
      .mutation(async ({ input }) => {
        await db.removeBasketItem(input.itemId);
        return { success: true };
      }),

    updateQuantity: protectedProcedure
      .input(z.object({
        itemId: z.number(),
        quantity: z.number().min(1),
      }))
      .mutation(async ({ input }) => {
        await db.updateBasketItemQuantity(input.itemId, input.quantity);
        return { success: true };
      }),

    optimize: protectedProcedure
      .input(z.object({
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get user memberships
        const memberships = await db.getUserMemberships(ctx.user.id);
        
        // Run optimization
        const result = await optimizeBasket(input.items, memberships);
        
        return result;
      }),
  }),

  // Price alerts
  alerts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const alerts = await db.getUserPriceAlerts(ctx.user.id);
      return alerts.map(alert => ({
        ...alert,
        targetPriceInAED: alert.targetPrice / 100,
      }));
    }),

    create: protectedProcedure
      .input(z.object({
        productId: z.number(),
        targetPrice: z.number(), // In AED
      }))
      .mutation(async ({ ctx, input }) => {
        const targetPriceInFils = Math.floor(input.targetPrice * 100);
        await db.createPriceAlert(ctx.user.id, input.productId, targetPriceInFils);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePriceAlert(input.alertId, ctx.user.id);
        return { success: true };
      }),
  }),

  // Deep link generation
  deeplinks: router({
    generate: publicProcedure
      .input(z.object({
        platformName: z.string(),
        productUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        const deepLink = generateDeepLink(input.platformName, input.productUrl);
        return {
          url: deepLink,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        };
      }),
  }),

  // AI Shopping Assistant
  assistant: router({
    conversations: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserConversations(ctx.user.id);
    }),

    createConversation: protectedProcedure
      .input(z.object({ title: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const conversationId = await db.createConversation(ctx.user.id, input.title);
        return { conversationId };
      }),

    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return db.getConversationMessages(input.conversationId);
      }),

    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        message: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Add user message
        await db.addMessage(input.conversationId, "user", input.message);

        // TODO: Implement AI response logic
        // For now, return a simple acknowledgment
        const response = `I understand you're looking for "${input.message}". Let me help you find the best prices!`;
        await db.addMessage(input.conversationId, "assistant", response);

        return { success: true };
      }),
  }),

  // Admin panel - scrape job monitoring
  admin: router({
    scrapeJobs: protectedProcedure.query(async ({ ctx }) => {
      // Only allow admin users
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      return db.getRecentScrapeJobs(50);
    }),

    triggerScrape: protectedProcedure
      .input(z.object({
        platformId: z.number(),
        category: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }

        const jobId = await db.createScrapeJob(input.platformId, input.category);
        
        // TODO: Trigger background worker
        // For now, just create the job
        
        return { jobId };
      }),
  }),
});

export type AppRouter = typeof appRouter;
