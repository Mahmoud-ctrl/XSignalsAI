import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

const BlurredOverlay = ({ children, isVisible, onUpgradeClick, upgradeMessage = "Upgrade your plan to see the AI analysis details" }) => (
  <div className="relative">
    <div className={`transition-all duration-300 ${isVisible ? 'filter blur-sm pointer-events-none' : ''}`}>
      {children}
    </div>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-b from-gray-900/50 via-gray-900/80 to-gray-900/95 flex items-center justify-center rounded-lg"
      >
        <div className="text-center p-6">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Lock className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          </motion.div>
          <h3 className="text-xl font-bold text-white mb-2">Premium Feature</h3>
          <p className="text-gray-300 mb-6 max-w-md">{upgradeMessage}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onUpgradeClick}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg"
          >
            Unlock Pro Features
          </motion.button>
        </div>
      </motion.div>
    )}
  </div>
);

export default BlurredOverlay;