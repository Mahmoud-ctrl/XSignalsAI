import { motion } from 'framer-motion';
import { Search, Plus, Sparkles, Lock, Info } from 'lucide-react';
import PlanBadge from './PlanBadge';

const CustomInputSection = ({
  customSymbol,
  selectedTimeframes,
  selectedAIModel,
  availableAIModels,
  userPlanInfo,
  loading,
  analysisData,
  includeBTC,
  handleCustomAnalysis,
  handleSymbolChange,
  handleTimeframeChange,
  handleAIModelChange,
  handleIncludeBTCChange
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.95 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/30 mb-6 shadow-2xl"
  >
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="flex items-center justify-between mb-6"
    >
      <h2 className="text-2xl font-bold text-white flex items-center">
        <motion.div
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.3 }}
        >
          <Search className="w-6 h-6 mr-3 text-orange-400" />
        </motion.div>
        Custom Analysis
      </h2>
      {userPlanInfo && (
        <PlanBadge plan={userPlanInfo.user_plan} />
      )}
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Symbol Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block text-gray-300 text-sm font-medium mb-3">
          Trading Pair Symbol
        </label>
        <motion.input
          whileFocus={{ scale: 1.02 }}
          type="text"
          value={customSymbol}
          onChange={handleSymbolChange}
          placeholder="e.g., BTCUSDT, ETHUSDT"
          className="w-full bg-gray-700/60 border-2 border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-orange-400 focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-orange-400/20"
        />
      </motion.div>

      {/* AI Model Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <label className="block text-gray-300 text-sm font-medium mb-3">
          AI Model {availableAIModels.length > 1 && <span className="text-orange-400">({availableAIModels.length} available)</span>}
        </label>
        <motion.select
          whileFocus={{ scale: 1.02 }}
          value={selectedAIModel}
          onChange={handleAIModelChange}
          disabled={availableAIModels.length <= 1}
          className="w-full bg-gray-700/60 border-2 border-gray-600/50 rounded-xl px-4 py-3 text-white focus:border-orange-400 focus:outline-none transition-all duration-300 disabled:opacity-50"
        >
          {availableAIModels.map((model) => (
            <option key={model} value={model} className="bg-gray-800 text-white">
              {model.includes('deepseek') ? 'DeepSeek (Free)' : 
               model.includes('claude') ? 'Claude 3.5 Sonnet' :
               model.includes('gpt-4') ? 'GPT-4 Turbo' :
               model.includes('gemini') ? 'Gemini Pro' :
               model.includes('llama') ? 'Llama 3' : 
               model}
            </option>
          ))}
        </motion.select>
        {availableAIModels.length <= 1 && userPlanInfo?.user_plan === 'free' && (
          <p className="text-xs text-orange-400 mt-1">
            Upgrade to access more AI models
          </p>
        )}
      </motion.div>

      {/* Timeframes Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <label className="block text-gray-300 text-sm font-medium mb-3">
          Select Timeframes {userPlanInfo?.user_plan === 'free' && <span className="text-orange-400">(Limited)</span>}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {Object.keys(selectedTimeframes).map((tf, index) => {
            const isDisabled = userPlanInfo?.user_plan === 'free' && !['5m', '1h'].includes(tf);
            return (
              <motion.label 
                key={tf} 
                className={`flex items-center cursor-pointer group ${isDisabled ? 'opacity-50' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={!isDisabled ? { x: 4 } : {}}
              >
                <input
                  type="checkbox"
                  checked={selectedTimeframes[tf] && !isDisabled}
                  onChange={() => !isDisabled && handleTimeframeChange(tf)}
                  disabled={isDisabled}
                  className="mr-2 w-3 h-3 text-orange-500 bg-gray-700/60 border-gray-500 rounded focus:ring-orange-400 focus:ring-2 transition-all duration-200"
                />
                <span className={`text-white text-xs font-medium group-hover:text-orange-300 transition-colors duration-200 ${isDisabled ? 'text-gray-500' : ''}`}>
                  {tf.toUpperCase()}
                  {isDisabled && <Lock className="w-3 h-3 inline ml-1" />}
                </span>
              </motion.label>
            );
          })}
        </div>
      </motion.div>
    </div>

    {/* Include BTC Analysis Section */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="mt-6 p-4 bg-gray-700/20 rounded-xl border border-gray-600/20"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <label className="block text-gray-300 text-sm font-medium">
            Include BTC Analysis
          </label>
          {userPlanInfo?.user_plan === 'free' && (
            <Lock className="w-4 h-4 ml-2 text-orange-400" />
          )}
        </div>
        <motion.label 
          className={`relative inline-flex items-center cursor-pointer ${
            userPlanInfo?.user_plan === 'free' ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          whileHover={userPlanInfo?.user_plan !== 'free' ? { scale: 1.05 } : {}}
        >
          <input
            type="checkbox"
            checked={includeBTC && userPlanInfo?.user_plan !== 'free'}
            onChange={handleIncludeBTCChange}
            disabled={userPlanInfo?.user_plan === 'free'}
            className="sr-only"
          />
          <div className={`w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer transition-all duration-300 ${
            includeBTC && userPlanInfo?.user_plan !== 'free' 
              ? 'bg-gradient-to-r from-orange-500 to-orange-600' 
              : 'bg-gray-600'
          }`}>
            <motion.div
              className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all duration-300"
              animate={{
                x: includeBTC && userPlanInfo?.user_plan !== 'free' ? 20 : 0
              }}
            />
          </div>
        </motion.label>
      </div>
      
      <div className="flex items-start space-x-3">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-gray-400 leading-relaxed">
          <p className="mb-1">
            When enabled, BTC price action and correlation will be analyzed alongside your selected coin to identify potential BTC influence on price movements.
          </p>
          {userPlanInfo?.user_plan === 'free' && (
            <p className="text-orange-400 font-medium">
              Available for Premium & Pro users only
            </p>
          )}
        </div>
      </div>
    </motion.div>

    {/* Plan Limitations Info */}
    {userPlanInfo && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30"
      >
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-300">
            <strong>Your Plan Limits:</strong> 
            {userPlanInfo.user_plan === 'free' && ' 1 pair, 5 scans/hour, 1 TP level'}
            {userPlanInfo.user_plan === 'premium' && ' 5 pairs, 20 scans/hour, 2 TP levels, BTC analysis'}
            {userPlanInfo.user_plan === 'pro' && ' 20 pairs, 100 scans/hour, 3 TP levels, BTC analysis'}
          </div>
          {userPlanInfo.user_plan !== 'pro' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="text-orange-400 hover:text-orange-300 text-sm font-medium"
            >
              Upgrade →
            </motion.button>
          )}
        </div>
      </motion.div>
    )}

    <motion.div 
      className="mt-6 flex gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <motion.button
        whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(251, 146, 60, 0.3)" }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCustomAnalysis}
        disabled={loading}
        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center shadow-lg shadow-orange-500/25 disabled:shadow-none"
      >
        <motion.div
          animate={loading ? { rotate: 360 } : { rotate: 0 }}
          transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
        >
          {loading ? <Sparkles className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
        </motion.div>
        {loading ? "Analyzing..." : "Start New Analysis"}
      </motion.button>

      {analysisData && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCustomInput(false)}
          className="bg-gray-600/60 hover:bg-gray-600/80 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 border border-gray-500/30 hover:border-gray-400/50"
        >
          Show Current Results
        </motion.button>
      )}
    </motion.div>
  </motion.div>
);

export default CustomInputSection;