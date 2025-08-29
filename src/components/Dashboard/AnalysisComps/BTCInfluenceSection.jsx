import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, TrendingDown, TrendingUp, AlertTriangle, Info } from 'lucide-react';

const BTCInfluenceSection = ({ analysisData }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!analysisData) return null;

  const getRiskColor = (level) => {
    switch (level) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getRiskBgColor = (level) => {
    switch (level) {
      case 'low': return 'bg-green-500/10 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'high': return 'bg-red-500/10 border-red-500/20';
      default: return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  const getTrendIcon = (trend) => {
    if (trend?.includes('SELL')) {
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    }
    return <TrendingUp className="w-4 h-4 text-green-400" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-lg border ${getRiskBgColor(analysisData.risk_level)} backdrop-blur-sm mb-6`}
    >
      {/* Header */}
      <div 
        className="p-4 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-orange-400 text-lg">₿</span>
            <h3 className="text-white font-medium">BTC Market Influence</h3>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Correlation Strength */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">Correlation:</span>
              <span className="text-sm font-mono text-blue-400">
                {(analysisData.correlation_strength * 100).toFixed(1)}%
              </span>
            </div>

            {/* BTC Trend */}
            <div className="flex items-center gap-1">
              {getTrendIcon(analysisData.btc_trend)}
              <span className="text-xs text-gray-300">{analysisData.btc_strength}%</span>
            </div>

            {/* Risk Level */}
            <div className="flex items-center gap-1">
              <AlertTriangle className={`w-3 h-3 ${getRiskColor(analysisData.risk_level)}`} />
              <span className={`text-xs font-medium ${getRiskColor(analysisData.risk_level)} uppercase`}>
                {analysisData.risk_level} Risk
              </span>
            </div>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-white/10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Risk Factors */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    Risk Factors
                  </h4>
                  <div className="space-y-2">
                    {analysisData.risk_factors.map((factor, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="text-sm text-gray-300 bg-white/5 rounded p-2 border-l-2 border-yellow-400/30"
                      >
                        {factor}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Right Column - Recommendations */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-400" />
                    Recommendations
                  </h4>
                  <div className="space-y-2">
                    {analysisData.recommendations.map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="text-sm text-gray-300 bg-white/5 rounded p-2 border-l-2 border-blue-400/30"
                      >
                        {rec}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Stats Row */}
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">BTC 24h:</span>
                  <span className={`text-sm font-mono ${analysisData.btc_24h_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {analysisData.btc_24h_change >= 0 ? '+' : ''}{analysisData.btc_24h_change.toFixed(2)}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Beta:</span>
                  <span className="text-sm font-mono text-purple-400">
                    {analysisData.beta.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Position Adjustment:</span>
                  <span className={`text-sm font-medium ${analysisData.position_size_adjustment === 'reduce' ? 'text-orange-400' : 'text-green-400'}`}>
                    {analysisData.position_size_adjustment.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Influence:</span>
                  <span className="text-sm text-gray-300 capitalize">
                    {analysisData.influence}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BTCInfluenceSection;