import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

const UpgradePrompt = ({ title, description, targetPlan = "premium" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30 rounded-xl p-6 text-center"
  >
    <motion.div
      animate={{ rotate: [0, 10, -10, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Lock className="w-12 h-12 text-orange-400 mx-auto mb-4" />
    </motion.div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-gray-300 mb-4">{description}</p>
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-semibold shadow-lg"
    >
      Upgrade to {targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)}
    </motion.button>
  </motion.div>
);

export default UpgradePrompt;