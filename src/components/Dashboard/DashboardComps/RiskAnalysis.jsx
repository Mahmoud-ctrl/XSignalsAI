import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

const RiskAnalysis = ({ riskAnalysis, itemVariants }) => {
  return (
    <motion.div 
      className="bg-gradient-to-br from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30 shadow-lg"
      variants={itemVariants}
    >
      <h3 className="text-lg font-semibold text-white mb-4">Risk Analysis</h3>
      {riskAnalysis ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-700/20 rounded-lg">
            <span className="text-gray-400">Overall Risk Level</span>
            <span className={`font-medium px-3 py-1 rounded-full text-sm ${
              riskAnalysis.overallRiskLevel === 'LOW' ? 'bg-green-500/20 text-green-400' :
              riskAnalysis.overallRiskLevel === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
            }`}>
              {riskAnalysis.overallRiskLevel}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Risk Score</span>
              <span className="text-white font-medium">{riskAnalysis.riskScore}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <motion.div 
                className={`h-3 rounded-full ${
                  riskAnalysis.riskScore <= 33 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                  riskAnalysis.riskScore <= 66 ? 'bg-gradient-to-r from-orange-500 to-orange-400' : 'bg-gradient-to-r from-red-500 to-red-400'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${riskAnalysis.riskScore}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-3 bg-gray-700/20 rounded-lg">
              <div className="text-lg font-bold text-green-400">{riskAnalysis.lowRisk}</div>
              <div className="text-xs text-gray-400">Low Risk</div>
            </div>
            <div className="text-center p-3 bg-gray-700/20 rounded-lg">
              <div className="text-lg font-bold text-orange-400">{riskAnalysis.mediumRisk}</div>
              <div className="text-xs text-gray-400">Medium Risk</div>
            </div>
            <div className="text-center p-3 bg-gray-700/20 rounded-lg">
              <div className="text-lg font-bold text-red-400">{riskAnalysis.highRisk}</div>
              <div className="text-xs text-gray-400">High Risk</div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-700/30">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
                Bullish Conditions
              </span>
              <span className="text-green-400 font-medium">{riskAnalysis.bullishConditions}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 flex items-center">
                <TrendingDown className="w-4 h-4 mr-2 text-red-400" />
                Bearish Conditions
              </span>
              <span className="text-red-400 font-medium">{riskAnalysis.bearishConditions}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-yellow-400" />
                Avg RSI
              </span>
              <span className="text-white font-medium">{riskAnalysis.avgRsi}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-500">Run a scan to see risk analysis</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default RiskAnalysis;