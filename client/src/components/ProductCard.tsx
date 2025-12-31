import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ShoppingCart, TrendingDown, Clock } from "lucide-react";
import { Link } from "wouter";

interface ProductCardProps {
  id: number;
  name: string;
  imageUrl?: string;
  bestPrice: number;
  originalPrice?: number;
  currency: string;
  platforms: Array<{
    name: string;
    price: number;
    staleness: 'fresh' | 'stale' | 'expired';
  }>;
  category?: string;
}

export function ProductCard({
  id,
  name,
  imageUrl,
  bestPrice,
  originalPrice,
  currency,
  platforms,
  category,
}: ProductCardProps) {
  const savings = originalPrice ? ((originalPrice - bestPrice) / originalPrice * 100).toFixed(0) : null;
  const freshPlatforms = platforms.filter(p => p.staleness === 'fresh');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/product/${id}`}>
        <Card className="overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow">
          <CardHeader className="p-0 relative">
            {/* Product Image */}
            <div className="aspect-square bg-muted relative overflow-hidden">
              {imageUrl ? (
                <motion.img
                  src={imageUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No Image
                </div>
              )}
              
              {/* Savings Badge */}
              {savings && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3"
                >
                  <Badge className="bg-gradient-to-r from-[#FFC107] to-[#FFD54D] text-black font-bold px-3 py-1 shadow-lg">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    {savings}% OFF
                  </Badge>
                </motion.div>
              )}
              
              {/* Category Badge */}
              {category && (
                <Badge variant="secondary" className="absolute top-3 left-3">
                  {category}
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-4 space-y-3">
            {/* Product Name */}
            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
              {name}
            </h3>
            
            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                {currency} {bestPrice.toFixed(2)}
              </span>
              {originalPrice && originalPrice > bestPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {currency} {originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            
            {/* Platform Badges */}
            <div className="flex flex-wrap gap-2">
              {platforms.slice(0, 3).map((platform, idx) => {
                const platformClass = `badge-${platform.name.toLowerCase().replace(' ', '-')}`;
                return (
                  <Badge
                    key={idx}
                    className={`${platformClass} text-xs px-2 py-0.5`}
                  >
                    {platform.name}
                  </Badge>
                );
              })}
              {platforms.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{platforms.length - 3} more
                </Badge>
              )}
            </div>
            
            {/* Freshness Indicator */}
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3 h-3" />
              <span className={`
                ${freshPlatforms.length === platforms.length ? 'text-green-600 dark:text-green-400' : ''}
                ${freshPlatforms.length === 0 ? 'text-red-600 dark:text-red-400' : ''}
                ${freshPlatforms.length > 0 && freshPlatforms.length < platforms.length ? 'text-yellow-600 dark:text-yellow-400' : ''}
              `}>
                {freshPlatforms.length === platforms.length && 'All prices fresh'}
                {freshPlatforms.length === 0 && 'Prices need update'}
                {freshPlatforms.length > 0 && freshPlatforms.length < platforms.length && 
                  `${freshPlatforms.length}/${platforms.length} fresh`}
              </span>
            </div>
          </CardContent>
          
          <CardFooter className="p-4 pt-0">
            <Button className="w-full group-hover:glow-primary transition-all" size="sm">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Compare Prices
            </Button>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
