import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface PriceDataPoint {
  date: string;
  [platform: string]: string | number;
}

interface PriceHistoryChartProps {
  data: Array<{
    date: Date;
    platform: string;
    price: number;
    availability: string;
  }>;
  stats: {
    lowest: number;
    highest: number;
    average: number;
    current: number;
    trend: "up" | "down" | "stable";
  };
}

const TIME_RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "All", days: 365 },
];

const PLATFORM_COLORS: Record<string, string> = {
  Amazon: "#FF9900",
  Noon: "#FED530",
  Talabat: "#FF6B00",
  Careem: "#00B140",
};

export function PriceHistoryChart({ data, stats }: PriceHistoryChartProps) {
  const [selectedRange, setSelectedRange] = useState(30);

  // Filter data based on selected time range
  const filteredData = data.filter(item => {
    const itemDate = new Date(item.date);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - selectedRange);
    return itemDate >= cutoffDate;
  });

  // Transform data for Recharts
  const chartData: PriceDataPoint[] = [];
  const dateMap = new Map<string, PriceDataPoint>();

  filteredData.forEach(item => {
    const dateStr = new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, { date: dateStr });
    }

    const point = dateMap.get(dateStr)!;
    // Convert fils to AED
    point[item.platform] = item.price / 100;
  });

  chartData.push(...Array.from(dateMap.values()));

  // Get unique platforms
  const platforms = Array.from(new Set(filteredData.map(item => item.platform)));

  // Trend icon
  const TrendIcon = stats.trend === "up" ? TrendingUp : stats.trend === "down" ? TrendingDown : Minus;
  const trendColor = stats.trend === "up" ? "text-red-500" : stats.trend === "down" ? "text-green-500" : "text-gray-500";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Price History</CardTitle>
            <CardDescription>Track price changes across platforms</CardDescription>
          </div>
          <div className="flex gap-2">
            {TIME_RANGES.map(range => (
              <Button
                key={range.days}
                variant={selectedRange === range.days ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRange(range.days)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Price Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-gray-600 mb-1">Lowest Price</p>
            <p className="text-2xl font-bold text-green-600">
              {(stats.lowest / 100).toFixed(2)} AED
            </p>
          </div>
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-gray-600 mb-1">Highest Price</p>
            <p className="text-2xl font-bold text-red-600">
              {(stats.highest / 100).toFixed(2)} AED
            </p>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Average Price</p>
            <p className="text-2xl font-bold text-blue-600">
              {(stats.average / 100).toFixed(2)} AED
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Current Price</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">
                {(stats.current / 100).toFixed(2)} AED
              </p>
              <TrendIcon className={`w-5 h-5 ${trendColor}`} />
            </div>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
                label={{ value: "Price (AED)", angle: -90, position: "insideLeft" }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${value.toFixed(2)} AED`, ""]}
              />
              <Legend />
              {platforms.map(platform => (
                <Line
                  key={platform}
                  type="monotone"
                  dataKey={platform}
                  stroke={PLATFORM_COLORS[platform] || "#6b7280"}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>No price history available for the selected time range</p>
          </div>
        )}

        {/* Price Savings Tip */}
        {stats.current > stats.lowest && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              💡 <strong>Savings Tip:</strong> This product was{" "}
              <strong>{(((stats.current - stats.lowest) / stats.current) * 100).toFixed(1)}% cheaper</strong>{" "}
              at {(stats.lowest / 100).toFixed(2)} AED. Set a price alert to get notified when it drops!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
