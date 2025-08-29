import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Search, Crown, Star, Zap, Check } from 'lucide-react';


const API_URL = import.meta.env.VITE_REACT_APP_API;

const PairSelector = ({ isOpen, onClose, onConfirm, initialPairs = [] }) => {
  const [availablePairs, setAvailablePairs] = useState([]);
  const [selectedPairs, setSelectedPairs] = useState(initialPairs);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTier, setUserTier] = useState('starter');
  const [maxPairs, setMaxPairs] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem("user") || '{}');
  const token = localStorage.getItem("access_token");

  // Tier configurations for display
  const tierConfig = {
    starter: {
      icon: Star,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-400/30',
      name: 'Starter'
    },
    plus: {
      icon: Zap,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-400/30',
      name: 'Plus'
    },
    pro: {
      icon: Crown,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-400/30',
      name: 'Pro'
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      fetchAvailablePairs();
    }
  }, [isOpen, token]);

  const fetchAvailablePairs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/available-pairs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAvailablePairs(data.available_pairs);
      setUserTier(data.user_tier);
      setMaxPairs(data.max_pairs);
      setError(null);
    } catch (err) {
      console.error('Error fetching available pairs:', err);
      setError(err.message || 'Failed to load available pairs');
    } finally {
      setLoading(false);
    }
  };

  const handlePairToggle = (pair) => {
    if (selectedPairs.includes(pair)) {
      setSelectedPairs(prev => prev.filter(p => p !== pair));
    } else {
      // Check if adding this pair would exceed the limit
      if (maxPairs && selectedPairs.length >= maxPairs) {
        return; // Don't add if limit reached
      }
      setSelectedPairs(prev => [...prev, pair]);
    }
  };

  const handleSelectAll = () => {
    if (maxPairs) {
      setSelectedPairs(availablePairs.slice(0, maxPairs));
    } else {
      setSelectedPairs([...availablePairs]);
    }
  };

  const handleClearAll = () => {
    setSelectedPairs([]);
  };

  const filteredPairs = availablePairs.filter(pair =>
    pair.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canAddMore = !maxPairs || selectedPairs.length < maxPairs;
  const tierInfo = tierConfig[userTier?.toLowerCase()] || tierConfig.starter;
  const TierIcon = tierInfo.icon;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-white">Select Trading Pairs</h2>
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${tierInfo.bgColor} ${tierInfo.color} ${tierInfo.borderColor} border`}>
                <TierIcon className="w-3 h-3 mr-1" />
                {tierInfo.name}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tier limits info */}
          <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
            <span>
              {selectedPairs.length} of {maxPairs || '∞'} pairs selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleSelectAll}
                disabled={selectedPairs.length === Math.min(availablePairs.length, maxPairs || availablePairs.length)}
                className="text-orange-400 hover:text-orange-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                Select All
              </button>
              <span className="text-gray-600">|</span>
              <button
                onClick={handleClearAll}
                disabled={selectedPairs.length === 0}
                className="text-orange-400 hover:text-orange-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search pairs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-2">{error}</p>
              <button
                onClick={fetchAvailablePairs}
                className="text-orange-400 hover:text-orange-300 text-sm"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredPairs.map((pair) => {
                const isSelected = selectedPairs.includes(pair);
                const canSelect = isSelected || canAddMore;
                
                return (
                  <motion.button
                    key={pair}
                    onClick={() => canSelect && handlePairToggle(pair)}
                    disabled={!canSelect}
                    className={`
                      relative p-3 rounded-lg border transition-all duration-200 text-sm font-medium
                      ${isSelected 
                        ? 'bg-orange-500/20 border-orange-400 text-orange-300' 
                        : canSelect
                          ? 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-600'
                          : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                      }
                    `}
                    whileHover={canSelect ? { scale: 1.02 } : {}}
                    whileTap={canSelect ? { scale: 0.98 } : {}}
                  >
                    {pair}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        <Check className="w-3 h-3" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Tier upgrade prompt for starter users */}
          {userTier?.toLowerCase() === 'starter' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-orange-500/10 border border-purple-400/20 rounded-lg"
            >
              <div className="flex items-start space-x-3">
                <Crown className="w-5 h-5 text-orange-400 mt-0.5" />
                <div>
                  <h3 className="text-white font-medium text-sm mb-1">Want more pairs?</h3>
                  <p className="text-gray-400 text-xs mb-2">
                    Upgrade to Plus (25 pairs) or Pro (unlimited) to scan more opportunities.
                  </p>
                  <button className="text-orange-400 hover:text-orange-300 text-xs font-medium">
                    Upgrade Now →
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {selectedPairs.length} pair{selectedPairs.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selectedPairs)}
              disabled={selectedPairs.length === 0}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PairSelector;