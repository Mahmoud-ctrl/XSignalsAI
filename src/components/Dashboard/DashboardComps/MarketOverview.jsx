import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

const MarketOverview = ({ marketData, formatNumber, formatTime, itemVariants }) => {
  const determineTrend = (change) => {
    if (change > 0.5) return "bullish";
    if (change < -0.5) return "bearish";
    return "neutral";
  };
  
  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {Object.entries(marketData).map(([symbol, data]) => (
        <motion.div
          key={symbol}
          variants={itemVariants}
          className={`bg-gradient-to-br from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-700/30 hover:border-orange-500/30 ${
            determineTrend(data.change) === "bullish"
              ? "border-l-4 border-l-green-500"
              : determineTrend(data.change) === "bearish"
              ? "border-l-4 border-l-red-500"
              : "border-l-4 border-l-yellow-500"
          }`}
        >
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-bold text-white">{symbol.toUpperCase()}</h2>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                data.change >= 0
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {data.change >= 0 ? "▲" : "▼"}{" "}
              {Math.abs(data.change).toFixed(2)}%
            </span>
          </div>

          <p className="text-2xl font-bold my-3 text-white">
            ${formatNumber(data.price)}
          </p>

          <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
            <span
              className={`inline-flex items-center ${
                determineTrend(data.change) === "bullish"
                  ? "text-green-400"
                  : determineTrend(data.change) === "bearish"
                  ? "text-red-400"
                  : "text-yellow-400"
              }`}
            >
              {determineTrend(data.change) === "bullish" ? (
                <>
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Bullish
                </>
              ) : determineTrend(data.change) === "bearish" ? (
                <>
                  <TrendingDown className="h-4 w-4 mr-1" />
                  Bearish
                </>
              ) : (
                <>Neutral</>
              )}
            </span>
            <span>{formatTime(data.last_updated)}</span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default MarketOverview;