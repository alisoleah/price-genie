import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  ShoppingCart, 
  TrendingDown, 
  Sparkles,
  Bell,
  BarChart3,
  Zap
} from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary">PriceGenie</h1>
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.name}
              </span>
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  Profile
                </Button>
              </Link>
            </div>
          ) : (
            <Button asChild size="sm">
              <a href={getLoginUrl()}>Login</a>
            </Button>
          )}
        </div>

        {/* Hero Content */}
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Shopping</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
            Find the Best Prices
            <br />
            <span className="text-primary">Across UAE</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Compare prices from Amazon, Noon, Careem, and Talabat. 
            Optimize your shopping basket with AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button asChild size="lg" className="text-base h-12">
              <Link href="/search">
                <Search className="h-5 w-5 mr-2" />
                Start Searching
              </Link>
            </Button>
            
            <Button asChild size="lg" variant="outline" className="text-base h-12">
              <Link href="/assistant">
                <Sparkles className="h-5 w-5 mr-2" />
                AI Assistant
              </Link>
            </Button>
            
            {isAuthenticated && (
              <Button asChild size="lg" variant="outline" className="text-base h-12">
                <Link href="/basket">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  My Basket
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-8">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Real-Time Prices</h3>
              <p className="text-sm text-muted-foreground">
                Compare live prices across multiple e-commerce platforms instantly
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-3">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg">Smart Optimization</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered basket optimizer finds the cheapest vendor split for you
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Bell className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg">Price Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Get notified when products drop below your target price
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg">Membership Savings</h3>
              <p className="text-sm text-muted-foreground">
                Factor in your Prime, Noon One, and other memberships
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg">Instant Checkout</h3>
              <p className="text-sm text-muted-foreground">
                Direct deep links to platform checkout pages for quick purchase
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-3">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Search className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg">Smart Search</h3>
              <p className="text-sm text-muted-foreground">
                Natural language search understands queries like "keto groceries under 200 AED"
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Supported Platforms */}
        <div className="pt-12 text-center space-y-4">
          <p className="text-sm text-muted-foreground">Supported Platforms</p>
          <div className="flex flex-wrap justify-center gap-6 items-center">
            {["Amazon UAE", "Noon", "Careem Now", "Talabat Mart"].map((platform) => (
              <div key={platform} className="px-6 py-3 bg-card border rounded-lg">
                <span className="font-semibold text-sm">{platform}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        {!isAuthenticated && (
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 mt-12">
            <CardContent className="p-8 text-center space-y-4">
              <h3 className="text-2xl font-bold">Ready to Save Money?</h3>
              <p className="text-muted-foreground">
                Join PriceGenie and start finding the best deals across UAE
              </p>
              <Button asChild size="lg" className="text-base">
                <a href={getLoginUrl()}>
                  Get Started Free
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
