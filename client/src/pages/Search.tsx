import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/PageTransition";
import { toast } from "sonner";

export default function Search() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: searchResults, isLoading } = trpc.products.search.useQuery(
    { query: searchTerm },
    { enabled: searchTerm.length > 0 }
  );

  const { data: suggestions } = trpc.searchHistory.getSuggestions.useQuery();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) {
      toast.error("Please enter at least 2 characters to search");
      return;
    }
    setSearchTerm(query);
    setShowSuggestions(false);
    toast.success(`Searching for "${query}"...`);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 glass border-b">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <Link href="/">
                <h1 className="text-2xl font-bold text-gradient-primary">PriceGenie</h1>
              </Link>
              <Link href="/basket">
                <Button variant="outline" size="icon" className="hover:glow-primary transition-all">
                  <ShoppingCart className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Search Section */}
        <div className="container py-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for products across Amazon, Noon, Careem, Talabat..."
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-12 h-14 text-base"
                />
                
                {/* Search Suggestions Dropdown */}
                {showSuggestions && suggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="p-2 space-y-1">
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left px-4 py-2 rounded hover:bg-accent transition-colors text-sm"
                        >
                          <SearchIcon className="inline h-4 w-4 mr-2 text-muted-foreground" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button 
                type="submit" 
                size="lg" 
                className="px-8 hover:glow-primary transition-all"
              >
                Search
              </Button>
            </div>
          </form>

          {/* Quick suggestions */}
          {!searchTerm && (
            <div className="mt-8 space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Popular searches:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "iPhone 15 Pro",
                  "Fresh Milk",
                  "Organic Eggs",
                  "Pasta",
                  "AirPods Pro",
                  "Samsung TV",
                  "Coffee Beans",
                  "Protein Powder"
                ].map((term) => (
                  <Button
                    key={term}
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQuery(term);
                      setSearchTerm(term);
                    }}
                    className="hover:scale-105 transition-transform"
                  >
                    {term}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="mt-12">
              <ProductGridSkeleton count={6} />
            </div>
          )}

          {/* Results */}
          {searchResults && searchResults.length > 0 && (
            <div className="mt-12 space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Found {searchResults.length} {searchResults.length === 1 ? 'product' : 'products'}
                </p>
                <Button variant="outline" size="sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                </Button>
              </div>

              <StaggerContainer>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map((product) => {
                    // Mock data for demo - in production, this comes from price snapshots
                    const mockPlatforms = [
                      { name: 'Amazon UAE', price: 299.99, staleness: 'fresh' as const },
                      { name: 'Noon', price: 289.99, staleness: 'fresh' as const },
                    ];

                    return (
                      <StaggerItem key={product.id}>
                        <ProductCard
                          id={product.id}
                          name={product.canonicalName}
                          imageUrl={product.imageUrl || undefined}
                          bestPrice={289.99}
                          originalPrice={349.99}
                          currency="AED"
                          platforms={mockPlatforms}
                          category={product.category || undefined}
                        />
                      </StaggerItem>
                    );
                  })}
                </div>
              </StaggerContainer>
            </div>
          )}

          {/* Empty State */}
          {searchResults && searchResults.length === 0 && searchTerm && (
            <EmptyState
              type="search"
              title="No products found"
              description={`We couldn't find any products matching "${searchTerm}". Try different keywords or check your spelling.`}
              actionLabel="Clear Search"
              onAction={() => {
                setQuery("");
                setSearchTerm("");
              }}
            />
          )}
        </div>
      </div>
    </PageTransition>
  );
}
