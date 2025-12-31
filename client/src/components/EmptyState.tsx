import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Search, ShoppingBag, Package } from "lucide-react";

interface EmptyStateProps {
  type: 'search' | 'basket' | 'alerts' | 'products';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const icons = {
  search: Search,
  basket: ShoppingBag,
  alerts: Package,
  products: Package,
};

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {/* Animated Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mb-6 p-6 rounded-full bg-muted/50"
      >
        <Icon className="w-16 h-16 text-muted-foreground" />
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold mb-2"
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground max-w-md mb-6"
      >
        {description}
      </motion.p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button onClick={onAction} size="lg">
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
