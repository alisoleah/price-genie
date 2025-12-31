from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime

from ..models.product import (
    Product,
    ProductListResponse,
    ProductDetailResponse,
    PlatformPrice,
)
from ..config import settings

router = APIRouter(prefix=settings.API_V1_STR, tags=["products"])

@router.get("", response_model=ProductListResponse)
async def list_products(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    List products with pagination.
    """
    # TODO: Implement database query with Drizzle
    # For now, return mock data
    products = []
    
    return ProductListResponse(
        products=products,
        total=len(products),
        page=offset // limit + 1,
        limit=limit,
    )

@router.get("/{product_id}", response_model=ProductDetailResponse)
async def get_product(product_id: int):
    """
    Get product details with all platform prices.
    """
    # TODO: Implement database query with Drizzle
    # For now, return mock data
    
    if product_id <= 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Mock product data
    product = Product(
        id=product_id,
        canonical_name=f"Product {product_id}",
        brand="Brand Name",
        category_id=1,
        category_name="Electronics",
        attributes={"storage": "256GB", "color": "Blue"},
        image_url=f"https://example.com/images/product-{product_id}.jpg",
        prices=[
            PlatformPrice(
                platform_id=1,
                platform_name="Amazon UAE",
                price=5199.00,
                currency="AED",
                availability="IN_STOCK",
                shipping_fee=0.0,
                total_cost=5199.00,
                staleness="FRESH",
                last_updated=datetime.utcnow(),
                deep_link_url=f"https://amazon.ae/dp/B0CHX{product_id}",
                is_best_price=True,
            ),
            PlatformPrice(
                platform_id=2,
                platform_name="Noon",
                price=5399.00,
                currency="AED",
                availability="IN_STOCK",
                shipping_fee=10.00,
                total_cost=5409.00,
                staleness="STALE",
                last_updated=datetime.utcnow() - timedelta(hours=18),
                deep_link_url=f"https://noon.com/product/NOON{product_id}",
                is_best_price=False,
            ),
        ],
        lowest_price=5199.00,
        highest_price=5399.00,
        average_price=5299.00,
        savings_percent=3.7,
    )
    
    return ProductDetailResponse(
        product=product,
        stats={
            "lowest_price": 5199.00,
            "highest_price": 5399.00,
            "average_price": 5299.00,
            "total_prices": 2,
        },
    )

@router.get("/{product_id}/prices", response_model=ProductDetailResponse)
async def get_product_prices(product_id: int):
    """
    Get latest prices for a product across all platforms.
    """
    # TODO: Implement database query with Drizzle
    # For now, return mock data
    
    if product_id <= 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Mock product data
    product = Product(
        id=product_id,
        canonical_name=f"Product {product_id}",
        brand="Brand Name",
        prices=[
            PlatformPrice(
                platform_id=1,
                platform_name="Amazon UAE",
                price=5199.00,
                currency="AED",
                availability="IN_STOCK",
                shipping_fee=0.0,
                total_cost=5199.00,
                staleness="FRESH",
                last_updated=datetime.utcnow(),
            ),
        ],
    )
    
    return ProductDetailResponse(
        product=product,
        stats={},
    )
