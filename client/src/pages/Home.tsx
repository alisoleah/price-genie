import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  ShoppingCart, 
  TrendingDown, 
  Sparkles,
  Bell,
  Zap,
  Shield
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { PageTransition, FadeIn, SlideIn } from "@/components/PageTransition";
import { motion } from "framer-motion";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
          <div className="container py-20 md:py-32">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">AI-Powered Shopping</span>
                </div>
              </FadeIn>

              <SlideIn delay={0.2}>
                <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                  Find the Best Prices
                  <br />
                  <span className="text-gradient-primary">Across UAE</span>
                </h1>
              </SlideIn>

              <SlideIn delay={0.4}>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Compare prices from Amazon, Noon, Careem, and Talabat. Optimize your shopping
                  basket with AI.
                </p>
              </SlideIn>

              <SlideIn delay={0.6}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/search">
                    <Button size="lg" className="px-8 h-12 text-base hover:glow-primary transition-all">
                      <Search className="w-5 h-5 mr-2" />
                      Start Searching
                    </Button>
                  </Link>
                  <Link href="/assistant">
                    <Button size="lg" variant="outline" className="px-8 h-12 text-base">
                      <Sparkles className="w-5 h-5 mr-2" />
                      AI Assistant
                    </Button>
                  </Link>
                  <Link href="/basket">
                    <Button size="lg" variant="outline" className="px-8 h-12 text-base">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      My Basket
                    </Button>
                  </Link>
                </div>
              </SlideIn>

              {!isAuthenticated && (
                <SlideIn delay={0.8}>
                  <p className="text-sm text-muted-foreground">
                    <a href={getLoginUrl()} className="text-primary hover:underline">
                      Sign in
                    </a>{" "}
                    to save your baskets and set price alerts
                  </p>
                </SlideIn>
              )}
            </div>
          </div>

          {/* Decorative gradient orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl opacity-20" />
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/20">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="p-8 rounded-2xl bg-card border hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingDown className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Real-Time Prices</h3>
                <p className="text-muted-foreground">
                  Compare live prices across multiple e-commerce platforms in real-time with staleness indicators.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="p-8 rounded-2xl bg-card border hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Smart Optimization</h3>
                <p className="text-muted-foreground">
                  AI-powered basket optimizer finds the cheapest vendor split considering memberships and shipping.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="p-8 rounded-2xl bg-card border hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Bell className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">Price Alerts</h3>
                <p className="text-muted-foreground">
                  Get notified when products drop below your target price or become available again.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-6 p-12 rounded-3xl glass">
              <Shield className="w-12 h-12 mx-auto text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold">
                Start Saving Today
              </h2>
              <p className="text-lg text-muted-foreground">
                Join thousands of smart shoppers in UAE who save money on every purchase.
              </p>
              <Link href="/search">
                <Button size="lg" className="px-8 h-12 text-base hover:glow-primary transition-all">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
