import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Zap, TrendingUp, Shield, BotIcon } from 'lucide-react';

const PlanLimitModal = ({ isOpen, onClose, currentPlan = 'free' }) => {
  const features = [
    { icon: TrendingUp, text: "Unlimited Daily Analysis", highlight: true },
    { icon: Crown, text: "Advanced AI Insights", highlight: true },
    { icon: Zap, text: "3 Take Profit Levels", highlight: true },
    { icon: BotIcon, text: "5+ AI Model Options", highlight: true }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-orange-400/30 rounded-2xl p-6 max-w-md w-full relative overflow-hidden"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-purple-500/10" />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Icon and title */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-orange-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Daily Limit Reached
                  </h2>
                  <p className="text-gray-400 text-sm">
                    You've hit your daily analysis limit. Upgrade to continue!
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center space-x-3 p-3 rounded-lg ${
                        feature.highlight 
                          ? 'bg-orange-500/10 border border-orange-400/20' 
                          : 'bg-gray-800/50'
                      }`}
                    >
                      <feature.icon className={`w-5 h-5 ${
                        feature.highlight ? 'text-orange-400' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm ${
                        feature.highlight ? 'text-orange-300' : 'text-gray-300'
                      }`}>
                        {feature.text}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Upgrade buttons */}
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // Handle upgrade to Pro
                      window.location.href = '/upgrade?plan=pro';
                    }}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg"
                  >
                    Upgrade to Pro
                  </motion.button>
                  
                  {currentPlan === 'free' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        // Handle upgrade to Premium
                        window.location.href = '/upgrade?plan=premium';
                      }}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 rounded-xl transition-all duration-200 border border-gray-600"
                    >
                      Or try Premium
                    </motion.button>
                  )}
                </div>

                {/* Dismissal option */}
                <button
                  onClick={onClose}
                  className="w-full text-gray-400 hover:text-gray-300 text-sm mt-4 transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PlanLimitModal;