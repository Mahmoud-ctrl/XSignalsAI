import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";

const AISignals = ({ 
  selectedPairs, planConfig, setShowPairSelector, timeframe, setTimeframe,
  minScore, setMinScore, scanMultipleSymbols, isScanning, scannedSymbols,
  handleAnalyzeClick, togglePairSelection, hasScanned, scanMessage
}) => {

  const formatResults = (status) => {
    return status
      .toLowerCase()
      .split('_')
      .map(word => word.toUpperCase())
      .join(' ');
  }

  return (
    <motion.div 
      className="bg-gradient-to-br from-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-700/30 shadow-xl"
    >
      <div className="p-6 border-b border-gray-700/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              AI Trading Signals
            </h2>
            <p className="text-gray-400 text-sm">
              Scan up to {planConfig.maxPairs} pairs with your {planConfig.name} plan
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Added class for tutorial target */}
            <motion.button
              onClick={() => setShowPairSelector(true)}
              className="flex items-center space-x-2 bg-gray-700/50 hover:bg-gray-600/50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-gray-600/50 hover:border-gray-500 pair-selector"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Search className="w-4 h-4" />
              <span>Select Pairs ({selectedPairs.length})</span>
            </motion.button>

            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-gray-700/50 text-gray-300 border border-gray-600/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="5m">5 Minutes</option>
              <option value="15m">15 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="4h">4 Hours</option>
              <option value="1d">1 Day</option>
              <option value="1w">1 Week</option>
            </select>

            <select
              value={minScore}
              onChange={(e) => setMinScore(parseFloat(e.target.value))}
              className="bg-gray-700/50 text-gray-300 border border-gray-600/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="0.3">Score: 0.3+</option>
              <option value="0.5">Score: 0.5+</option>
              <option value="0.7">Score: 0.7+</option>
              <option value="0.9">Score: 0.9+</option>
              <option value="1.0">Score: 1.0</option>
            </select>

            {/* Added class for tutorial target */}
            <motion.button
              onClick={scanMultipleSymbols}
              disabled={isScanning || selectedPairs.length === 0}
              className="bg-orange-500/90 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg scan-button"
              whileHover={{ scale: isScanning ? 1 : 1.02 }}
              whileTap={{ scale: isScanning ? 1 : 0.98 }}
            >
              {isScanning ? 'Scanning...' : 'Scan Signals'}
            </motion.button>
          </div>
        </div>

        {selectedPairs.length > 0 && (
          <motion.div 
            className="mt-4 p-3 bg-gray-700/20 rounded-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm font-medium">Selected Pairs:</span>
              <span className="text-xs text-gray-500">
                {selectedPairs.length}/{planConfig.maxPairs} used
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedPairs.map((pair) => (
                <span
                  key={pair}
                  className="inline-flex items-center bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs font-medium"
                >
                  {pair}
                  <button
                    onClick={() => togglePairSelection(pair)}
                    className="ml-1 hover:bg-orange-500/30 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700/30">
              <th className="text-left py-4 px-6 text-gray-400 font-medium">Pair</th>
              <th className="text-left py-4 px-6 text-gray-400 font-medium">Signal</th>
              <th className="text-left py-4 px-6 text-gray-400 font-medium">Confidence</th>
              <th className="text-left py-4 px-6 text-gray-400 font-medium">Risk Level</th>
              <th className="text-left py-4 px-6 text-gray-400 font-medium">Market Condition</th>
              <th className="text-left py-4 px-6 text-gray-400 font-medium">Action</th>
            </tr>
          </thead>
          {/* Added class for tutorial target */}
          <tbody className="signals-results">
            {isScanning ? (
              <tr>
                <td colSpan="6" className="py-8 px-6 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden max-w-md">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                    <p className="text-sm text-gray-400">
                      Scanning {selectedPairs.length} pair{selectedPairs.length > 1 ? 's' : ''} for signals...
                    </p>
                  </div>
                </td>
              </tr>
            ) : scannedSymbols.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 px-6 text-center text-gray-400">
                  {scanMessage}
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {scannedSymbols.map((signal, index) => (
                  <motion.tr
                    key={`${signal.symbol}-${index}`}
                    className="border-b border-gray-700/20 hover:bg-gray-700/10 transition-colors duration-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <td className="py-4 px-6 text-white font-medium">
                      {signal.symbol}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          signal.signal.includes("BUY")
                            ? "bg-green-500/20 text-green-400"
                            : signal.signal.includes("SELL")
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {signal.signal}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-300">{signal.confidence}%</td>
                    <td className="py-4 px-6">
                      <span 
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          signal.risk_level === 'LOW' 
                            ? 'bg-green-500/20 text-green-400'
                            : signal.risk_level === 'HIGH'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {formatResults(signal.risk_level)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-300 text-sm">
                      {formatResults(signal.market_condition)}
                    </td>
                    <td className="py-4 px-6">
                      {/* Added class for tutorial target */}
                      <motion.button
                        onClick={() => handleAnalyzeClick(signal.symbol)}
                        className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 hover:text-orange-300 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border border-orange-500/30 hover:border-orange-400/50 analyze-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Analyze
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default AISignals;
