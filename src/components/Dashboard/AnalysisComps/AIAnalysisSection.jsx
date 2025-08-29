import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Target, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import PlanBadge from './PlanBadge';
import BlurredOverlay from './BlurredOverlay';

const AIAnalysisSection = ({ 
  aiAnalysis, 
  aiSignal, 
  userPlanInfo, 
  selectedAIModel, 
  parseAIAnalysis, 
  getSignalBg, 
  getSignalColor, 
  formatEntryStatus 
}) => {
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  
  const parsedAnalysis = parseAIAnalysis(aiAnalysis, aiSignal);
  const { sections, jsonSummary, hasStructuredData } = parsedAnalysis;
  
  const isFreeUser = userPlanInfo?.user_plan === 'free';
  const showAIResponse = userPlanInfo?.user_plan_info?.show_ai_response || userPlanInfo?.user_plan === 'pro';
  
  const handleUpgradeClick = () => {
    console.log('Redirect to upgrade page');
  };

  console.log('AIAnalysisSection Debug:', {
    hasAiAnalysis: !!aiAnalysis,
    hasAiSignal: !!aiSignal,
    hasStructuredData,
    jsonSummaryKeys: jsonSummary ? Object.keys(jsonSummary) : [],
    sectionsCount: Object.keys(sections).length
  });

  if (!hasStructuredData && !aiAnalysis) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-orange-500/10 border border-orange-400/30 rounded-xl p-6"
      >
        <div className="flex items-center text-orange-400 mb-2">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span className="font-semibold">No Analysis Data Available</span>
        </div>
        <p className="text-orange-300">
          The AI analysis could not be processed. Please try again or contact support.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {jsonSummary && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-6 border border-indigo-400/30 shadow-xl"
        >
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between mb-6"
          >
            <h3 className="text-2xl font-bold text-white flex items-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <Target className="w-7 h-7 mr-3 text-indigo-400" />
              </motion.div>
              Trading Signal
              {hasStructuredData && (
                <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                  STRUCTURED
                </span>
              )}
            </h3>
            {userPlanInfo && (
              <div className="flex items-center gap-2">
                <PlanBadge plan={userPlanInfo.user_plan} />
                {selectedAIModel && (
                  <div className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                    {selectedAIModel.includes('deepseek') ? 'DeepSeek' : 
                     selectedAIModel.includes('claude') ? 'Claude' :
                     selectedAIModel.includes('gpt-4') ? 'GPT-4' :
                     'AI'}
                  </div>
                )}
              </div>
            )}
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <p className="text-gray-300 text-sm mb-3 font-medium">Primary Signal</p>
              <motion.span 
                whileHover={{ scale: 1.05 }}
                className={`px-6 py-3 rounded-xl font-bold text-xl inline-block ${
                  getSignalBg(jsonSummary.primary_signal)
                } ${getSignalColor(jsonSummary.primary_signal)}`}
              >
                {jsonSummary.primary_signal || 'N/A'}
              </motion.span>
              <p className="text-gray-300 text-sm mt-3">
                Confidence: <span className="text-white font-bold">{jsonSummary.confidence || 'N/A'}/10</span>
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <p className="text-gray-300 text-sm mb-3 font-medium">Entry Price</p>
              <div className="text-white">
                {jsonSummary.entry_zone && Array.isArray(jsonSummary.entry_zone) ? (
                  <div>
                    <motion.p 
                      whileHover={{ scale: 1.05 }}
                      className="text-2xl font-bold text-blue-400"
                    >
                      ${jsonSummary.entry_zone[0]} - ${jsonSummary.entry_zone[1]}
                    </motion.p>
                    <div className={`px-4 py-2 mt-3 rounded-lg text-sm font-semibold ${getSignalBg(jsonSummary.entry_status)} ${getSignalColor(jsonSummary.entry_status)}`}>
                      {formatEntryStatus(jsonSummary.entry_status)}
                    </div>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-blue-400">N/A</p>
                )}
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <p className="text-gray-300 text-sm mb-3 font-medium">Stop Loss</p>
              <motion.p 
                whileHover={{ scale: 1.05 }}
                className="text-2xl font-bold text-red-400"
              >
                ${jsonSummary.stop_loss || 'N/A'}
              </motion.p>
              <p className="text-gray-300 text-sm mt-3">
                Risk: <span className={`font-medium px-2 py-1 rounded text-xs ${
                  jsonSummary.risk_level === 'LOW' ? 'bg-green-500/20 text-green-400' :
                  jsonSummary.risk_level === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {jsonSummary.risk_level || 'N/A'}
                </span>
              </p>
            </motion.div>
          </div>
          
          {jsonSummary.take_profits && jsonSummary.take_profits.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-gray-300 text-sm mb-4 font-medium flex items-center">
                Take Profit Targets:
                {userPlanInfo?.user_plan === 'free' && (
                  <span className="ml-2 text-orange-400 text-xs">
                    (Limited to 1 TP - Upgrade for more)
                  </span>
                )}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(() => {
                // Ensure we always show at least 3 targets, pad with placeholders if needed
                const allTargets = [...jsonSummary.take_profits];
                while (allTargets.length < 3) {
                  allTargets.push(null); // Add placeholder for locked targets
                }
                return allTargets;
              })().map((tp, index) => {
                  const maxTpLevels = userPlanInfo?.user_plan === 'free' ? 1 : 
                                    userPlanInfo?.user_plan === 'premium' ? 2 : 3;
                  const isLocked = index >= maxTpLevels;
                  
                  return (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      whileHover={!isLocked ? { scale: 1.02, y: -2 } : {}}
                      className={`border rounded-xl p-4 text-center shadow-lg relative overflow-hidden ${
                        isLocked 
                          ? 'bg-gray-500/10 border-gray-400/20' 
                          : 'bg-green-500/20 border-green-400/30'
                      }`}
                    >
                      {/* Blur overlay for locked items */}
                      {isLocked && (
                        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                          <div className="text-center">
                            <Lock className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                            <p className="text-xs text-orange-400 font-medium">
                              {userPlanInfo?.user_plan === 'free' ? 'Premium+' : 'Pro'} Plan
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Content (always rendered, but blurred if locked) */}
                      <div className={isLocked ? 'filter blur-sm' : ''}>
                        <p className={`font-bold text-lg ${isLocked ? 'text-gray-400' : 'text-green-400'}`}>
                          TP{index + 1}
                        </p>
                        <p className={`text-xl font-bold ${isLocked ? 'text-gray-500' : 'text-white'}`}>
                          {tp ? `${tp}` : '$---.--'}
                        </p>
                        <p className={`text-xs mt-1 ${isLocked ? 'text-gray-500' : 'text-gray-300'}`}>
                          Target {index + 1}
                        </p>
                      </div>
                      
                      {/* Upgrade hint for locked items */}
                      {isLocked && (
                        <div className="absolute bottom-2 left-0 right-0 z-20">
                          <p className="text-xs text-center text-gray-400 px-2">
                            Upgrade to unlock
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-6 pt-4 border-t border-gray-600/30"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-gray-400 text-xs">Timeframe</p>
                <p className="text-white font-medium">{jsonSummary.timeframe || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Duration</p>
                <p className="text-white font-medium">{jsonSummary.trade_duration || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">R:R Ratio</p>
                <p className="text-white font-medium">{jsonSummary.risk_reward_ratio || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">AI Model</p>
                <p className="text-white font-medium text-xs">
                  {selectedAIModel?.includes('deepseek') ? 'DeepSeek' : 
                   selectedAIModel?.includes('claude') ? 'Claude' :
                   selectedAIModel?.includes('gpt-4') ? 'GPT-4' :
                   'AI'}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {aiAnalysis && (
        <div className="bg-gray-800/40 rounded-xl border border-gray-600/30 overflow-hidden">
          <motion.button
            whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.4)" }}
            onClick={() => setShowFullAnalysis(!showFullAnalysis)}
            className="w-full px-6 py-4 text-left flex items-center justify-between transition-colors duration-200"
          >
            <span className="text-white font-medium flex items-center">
              📚 Full AI Analysis (Raw)
              {!showAIResponse && <Lock className="w-4 h-4 ml-2 text-orange-400" />}
            </span>
            <motion.span 
              animate={{ rotate: showFullAnalysis ? 90 : 0 }}
              className="text-gray-400 text-sm"
            >
              {showFullAnalysis ? '▼ Hide' : '▶ Show'}
            </motion.span>
          </motion.button>
          
          <AnimatePresence>
            {showFullAnalysis && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="px-6 pb-6 border-t border-gray-600/30 overflow-hidden"
              >
                <BlurredOverlay 
                  isVisible={!showAIResponse}
                  onUpgradeClick={handleUpgradeClick}
                  upgradeMessage="Upgrade to Pro to see the full AI reasoning and detailed analysis process"
                >
                  <div className="bg-gray-900/50 rounded-lg p-4 mt-4">
                    <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                      <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                    </pre>
                  </div>
                </BlurredOverlay>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {!jsonSummary && Object.keys(sections).length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-500/10 border border-orange-400/30 rounded-xl p-6 text-center"
        >
          <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Analysis Incomplete</h3>
          <p className="text-orange-300">
            The AI analysis could not be fully completed due to high traffic on our servers. This isn’t an issue on your side, please try again shortly.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => window.location.reload()}
            className="mt-4 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AIAnalysisSection;