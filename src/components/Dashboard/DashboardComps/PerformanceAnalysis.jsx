import { motion } from "framer-motion";
import { Activity, TrendingUp } from "lucide-react";

const PerformanceAnalysis = ({ performanceMetrics, itemVariants }) => {
  return (
    <motion.div 
      className="bg-gradient-to-br from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30 shadow-lg"
      variants={itemVariants}
    >
      <h3 className="text-lg font-semibold text-white mb-4">Performance Overview</h3>
      {performanceMetrics ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-700/20 rounded-lg">
              <div className="text-2xl font-bold text-white">{performanceMetrics.totalSignals}</div>
              <div className="text-sm text-gray-400">Total Signals</div>
            </div>
            <div className="text-center p-3 bg-gray-700/20 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{performanceMetrics.buySignals}</div>
              <div className="text-sm text-gray-400">Buy Signals</div>
            </div>
            <div className="text-center p-3 bg-gray-700/20 rounded-lg">
              <div className="text-2xl font-bold text-red-400">{performanceMetrics.sellSignals}</div>
              <div className="text-sm text-gray-400">Sell Signals</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Buy/Sell Distribution</span>
              <span className="text-gray-300">{performanceMetrics.buyPercentage}% / {performanceMetrics.sellPercentage}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div className="h-full flex">
                <motion.div 
                  className="bg-gradient-to-r from-green-500 to-green-400 h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${performanceMetrics.buyPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
                <motion.div 
                  className="bg-gradient-to-r from-red-500 to-red-400 h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${performanceMetrics.sellPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-700/30">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Avg Confidence
              </span>
              <span className="text-white font-medium">{performanceMetrics.avgConfidence}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                Avg Score
              </span>
              <span className="text-white font-medium">{performanceMetrics.avgScore}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Strong Signals</span>
              <span className="text-orange-400 font-medium">{performanceMetrics.strongSignals}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg">
          <div className="text-center">
            <Activity className="w-12 h-12 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-500">Run a scan to see performance data</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PerformanceAnalysis;