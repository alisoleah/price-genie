from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class PlatformPrice(BaseModel):
    platform_id: int
    platform_name: str
    price: float
    currency: str = "AED"
    availability: str  # IN_STOCK, LOW_STOCK, OUT_OF_STOCK
    shipping_fee: float = 0.0
    total_cost: float
    staleness: str  # FRESH, STALE, EXPIRED
    last_updated: datetime
    deep_link_url: str
    is_best_price: bool = False

class Product(BaseModel):
    id: int
    canonical_name: str
    brand: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    attributes: dict = {}
    image_url: Optional[str] = None
    prices: List[PlatformPrice]
    lowest_price: float
    highest_price: float
    average_price: float
    savings_percent: float

class ProductListResponse(BaseModel):
    products: List[Product]
    total: int
    page: int
    limit: int

class ProductDetailResponse(BaseModel):
    product: Product
    stats: dict

class SearchRequest(BaseModel):
    query: str
    filters: Optional[dict] = None
    pagination: Optional[dict] = None
    user_memberships: Optional[dict] = None

class BasketItem(BaseModel):
    product_id: int
    product_name: str
    quantity: int = 1
    preferred_platform_id: Optional[int] = None

class BasketOptimizeRequest(BaseModel):
    items: List[BasketItem]
    memberships: dict
    preferences: Optional[dict] = None

class PlatformSplit(BaseModel):
    platform_id: int
    platform_name: str
    items: List[dict]
    subtotal: float
    shipping_fee: float
    membership_discount: float
    platform_total: float
    meets_minimum_order: bool = True
    checkout_url: str
    item_deep_links: List[dict]

class BasketOptimizeResponse(BaseModel):
    success: bool
    summary: dict
    platform_splits: List[PlatformSplit]
    warnings: List[dict]
    meta: dict

class ErrorResponse(BaseModel):
    success: bool = False
    error: dict
    message: str
    code: str
