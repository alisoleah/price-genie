-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create HNSW index for product embeddings
CREATE INDEX IF NOT EXISTS idx_products_embedding_hnsw ON products USING hnsw (embedding vector_cosine_ops);

-- Create HNSW index for raw product embeddings
CREATE INDEX IF NOT EXISTS idx_raw_products_embedding_hnsw ON raw_products USING hnsw (embedding vector_cosine_ops);

-- Create GIN index for JSONB attributes
CREATE INDEX IF NOT EXISTS idx_products_attributes_gin ON products USING GIN (attributes);

-- Create GIN index for scrape config
CREATE INDEX IF NOT EXISTS idx_platforms_scrape_config_gin ON platforms USING GIN (scrape_config);

-- Create GIN index for user membership benefits
CREATE INDEX IF NOT EXISTS idx_user_memberships_benefits_gin ON user_memberships USING GIN (benefits);

-- Create partial index for fresh prices only
CREATE INDEX idx_price_snapshots_fresh ON price_snapshots (raw_product_id, scraped_at DESC) 
WHERE scraped_at > NOW() - INTERVAL '1 hour';

-- Create unique index for active basket per user
CREATE UNIQUE INDEX idx_user_baskets_active_unique ON user_baskets (user_id) 
WHERE is_active = true;
