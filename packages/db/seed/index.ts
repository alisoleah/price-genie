import { db } from '../db';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // 1. Seed Platforms
    console.log('📦 Seeding platforms...');
    const platformData = [
      {
        name: 'amazon_uae',
        displayName: 'Amazon UAE',
        baseUrl: 'https://amazon.ae',
        logoUrl: '/assets/icons/amazon.svg',
        scrapeConfig: {
          rateLimitRpm: 10,
          requiresJs: true,
          proxyRequired: true,
        },
        affiliateId: 'pricegenie-21',
        deepLinkTemplate: 'https://amazon.ae/dp/{sku}?tag={affiliate_id}',
      },
      {
        name: 'noon',
        displayName: 'Noon',
        baseUrl: 'https://noon.com',
        logoUrl: '/assets/icons/noon.svg',
        scrapeConfig: {
          rateLimitRpm: 10,
          requiresJs: true,
          proxyRequired: false,
        },
        affiliateId: 'pricegenie_ref',
        deepLinkTemplate: 'https://noon.com/uae-en/product/{sku}?ref={affiliate_id}',
      },
    ];

    await db.insert({ platforms: platformData });
    console.log(`✅ Inserted ${platformData.length} platforms`);

    // 2. Seed Categories
    console.log('📂 Seeding categories...');
    const categoryData = [
      { name: 'Electronics', slug: 'electronics', sortOrder: 1 },
      { name: 'Groceries', slug: 'groceries', sortOrder: 2 },
      { name: 'Fashion', slug: 'fashion', sortOrder: 3 },
      { name: 'Home & Kitchen', slug: 'home-kitchen', sortOrder: 4 },
      { name: 'Beauty', slug: 'beauty', sortOrder: 5 },
      { name: 'Sports', slug: 'sports', sortOrder: 6 },
      { name: 'Books', slug: 'books', sortOrder: 7 },
      { name: 'Toys', slug: 'toys', sortOrder: 8 },
      { name: 'Baby', slug: 'baby', sortOrder: 9 },
      { name: 'Health', slug: 'health', sortOrder: 10 },
    ];

    await db.insert({ categories: categoryData });
    console.log(`✅ Inserted ${categoryData.length} categories`);

    console.log('🎉 Database seeding completed!');
    console.log('\n📊 Summary:');
    console.log(`   - ${platformData.length} platforms`);
    console.log(`   - ${categoryData.length} categories`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
