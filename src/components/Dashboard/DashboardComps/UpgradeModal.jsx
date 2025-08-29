import { motion, AnimatePresence } from "framer-motion";
import { Crown } from "lucide-react";

const UpgradeModal = ({ showUpgradeModal, setShowUpgradeModal, userPlan, PLAN_CONFIGS }) => {
  const planConfig = PLAN_CONFIGS[userPlan];

  return (
    <AnimatePresence>
      {showUpgradeModal && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowUpgradeModal(false)}
        >
          <motion.div
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl max-w-md w-full shadow-2xl border border-gray-700"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Upgrade Your Plan</h3>
              <p className="text-gray-400 mb-6">
                You've reached the limit of {planConfig.maxPairs} pairs for your {planConfig.name} plan. 
                Upgrade to scan more pairs simultaneously!
              </p>

              <div className="space-y-3 mb-6">
                {Object.entries(PLAN_CONFIGS)
                  .filter(([key]) => key !== userPlan)
                  .map(([key, config]) => {
                    const PlanIcon = config.icon;
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
                      >
                        <div className="flex items-center">
                          <PlanIcon className={`w-5 h-5 text-${config.color}-400 mr-3`} />
                          <div className="text-left">
                            <div className="font-medium text-white">{config.name}</div>
                            <div className="text-sm text-gray-400">{config.maxPairs} pairs</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">From</div>
                          <div className="font-bold text-white">$19/mo</div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-2 text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
                >
                  Maybe Later
                </button>
                <motion.button
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Upgrade Now
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;
