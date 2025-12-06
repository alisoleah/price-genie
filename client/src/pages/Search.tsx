import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, ShoppingCart, TrendingDown } from "lucide-react";
import { Link } from "wouter";

export default function Search() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: products, isLoading } = trpc.products.search.useQuery(
    { query: searchTerm },
    { enabled: searchTerm.length > 0 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(query);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <h1 className="text-2xl font-bold text-primary">PriceGenie</h1>
            </Link>
            <Link href="/basket">
              <Button variant="outline" size="icon">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="container py-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button type="submit" size="lg" className="px-6">
              Search
            </Button>
          </div>
        </form>

        {/* Quick suggestions */}
        {!searchTerm && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted-foreground">Popular searches:</p>
            <div className="flex flex-wrap gap-2">
              {["iPhone", "Milk", "Eggs", "Pasta", "Headphones"].map((term) => (
                <Button
                  key={term}
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery(term);
                    setSearchTerm(term);
                  }}
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading && (
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-muted rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {products && products.length > 0 && (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-muted-foreground">
              Found {products.length} products
            </p>
            {products.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={product.imageUrl || "/placeholder-product.png"}
                        alt={product.canonicalName}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base line-clamp-2">
                          {product.canonicalName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {product.brand && (
                            <Badge variant="secondary" className="text-xs">
                              {product.brand}
                            </Badge>
                          )}
                          {product.category && (
                            <span className="text-xs text-muted-foreground">
                              {product.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <TrendingDown className="h-4 w-4 text-primary" />
                          <span className="text-sm text-primary font-medium">
                            Compare prices
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {products && products.length === 0 && searchTerm && (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">No products found for "{searchTerm}"</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try a different search term
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
