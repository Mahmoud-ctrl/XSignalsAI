import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Lock } from "lucide-react";
import { useState } from "react";

const PairSelectionModal = ({ 
  showPairSelector, setShowPairSelector, selectedPairs,
  togglePairSelection, planConfig, CRYPTO_PAIRS
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getAllPairs = () => {
    return [...CRYPTO_PAIRS.major, ...CRYPTO_PAIRS.defi, ...CRYPTO_PAIRS.altcoins];
  };

  const getFilteredPairs = (pairs) => {
    if (!searchTerm) return pairs;
    return pairs.filter(pair => 
      pair.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <AnimatePresence>
      {showPairSelector && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowPairSelector(false)}
        >
          <motion.div
            className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-gray-700"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">Select Trading Pairs</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Choose up to {planConfig.maxPairs} pairs for your {planConfig.name} plan
                  </p>
                </div>
                <button
                  onClick={() => setShowPairSelector(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search pairs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              <div className="space-y-6">
                {selectedPairs.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-3">Selected Pairs ({selectedPairs.length}/{planConfig.maxPairs})</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {selectedPairs.map((pair) => (
                        <motion.button
                          key={pair}
                          onClick={() => togglePairSelection(pair)}
                          className="flex items-center justify-between bg-orange-500/20 border border-orange-500/30 text-orange-400 px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-500/30 transition-all"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span>{pair}</span>
                          <X className="w-4 h-4" />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-white font-medium mb-3">Available Pairs</h4>
                  <div className="space-y-4">
                    {Object.entries(CRYPTO_PAIRS).map(([category, pairs]) => {
                      const filteredPairs = getFilteredPairs(pairs).filter(pair => !selectedPairs.includes(pair));
                      
                      if (filteredPairs.length === 0) return null;

                      return (
                        <div key={category}>
                          <h5 className="text-gray-400 text-sm font-medium mb-2 capitalize">
                            {category} Pairs
                          </h5>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {filteredPairs.map((pair) => (
                              <motion.button
                                key={pair}
                                onClick={() => togglePairSelection(pair)}
                                disabled={selectedPairs.length >= planConfig.maxPairs}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  selectedPairs.length >= planConfig.maxPairs
                                    ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                                    : 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-600/50 hover:border-gray-500'
                                }`}
                                whileHover={selectedPairs.length < planConfig.maxPairs ? { scale: 1.02 } : {}}
                                whileTap={selectedPairs.length < planConfig.maxPairs ? { scale: 0.98 } : {}}
                              >
                                <span>{pair}</span>
                                {selectedPairs.length >= planConfig.maxPairs && (
                                  <Lock className="w-4 h-4" />
                                )}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  {selectedPairs.length}/{planConfig.maxPairs} pairs selected
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPairSelector(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={() => setShowPairSelector(false)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Done
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PairSelectionModal;