import { React, useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Target, Shield, Info, X, Clock,
  BarChart3, Search, Settings, Plus, Sparkles, Crown, Lock, Eye, EyeOff, Zap,
} from "lucide-react";
import EngagingCryptoLoader from "../Loading";
import formatEntryStatus from "../../utils/formatEntry";
import PlanBadge from "./AnalysisComps/PlanBadge";
import UpgradePrompt from "./AnalysisComps/UpgradePrompt";
import CustomInputSection from "./AnalysisComps/CustomInputSection";
import AIAnalysisSection from "./AnalysisComps/AIAnalysisSection";
import BTCInfluenceSection from "./AnalysisComps/BTCInfluenceSection";
import PlanLimitModal from "../PlanLimitModal";
import Cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_REACT_APP_API || "http://localhost:5000/api";

// Create a simple cache to persist analysis data
const analysisCache = new Map();

const ComprehensiveAnalysis = ({
  symbol: initialSymbol,
  timeframe,
  onBack,
}) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCustomInput, setShowCustomInput] = useState(!initialSymbol);
  const [userPlanInfo, setUserPlanInfo] = useState(null);
  const [availableAIModels, setAvailableAIModels] = useState([]);
  const [selectedAIModel, setSelectedAIModel] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPlanLimitModal, setShowPlanLimitModal] = useState(false);
  const [includeBTC, setIncludeBTC] = useState(false);

  // Custom input states - memoized to prevent unnecessary re-renders
  const [customSymbol, setCustomSymbol] = useState(initialSymbol || "");
  const [selectedTimeframes, setSelectedTimeframes] = useState({
    "5m": true,
    "15m": true,
    "1h": true,
    "4h": true,
    "1d": true,
  });

  const formatLabel = (value) => {
    if (!value) return "N/A";
    return value
      .toLowerCase() // weak_uptrend
      .replace(/_/g, " ") // weak uptrend
      .replace(/\b\w/g, (c) => c.toUpperCase()); // Weak Uptrend
  };

  // Fetch user plan info and available AI models on component mount
  useEffect(() => {
    fetchUserPlanInfo();
    fetchAvailableAIModels();
  }, []);

  const fetchUserPlanInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/plan-info`, {
        credentials: 'include',  
      });

      if (response.ok) {
        const data = await response.json();
        setUserPlanInfo(data);
      }
    } catch (err) {
      console.error("Error fetching plan info:", err);
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
  };

  const fetchAvailableAIModels = async () => {
    try {
      const response = await fetch(`${API_URL}/available-ai-models`, {
        credentials: 'include',  
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableAIModels(data.available_models || []);
        setSelectedAIModel(data.current_default || "");
      }
    } catch (err) {
      console.error("Error fetching available AI models:", err);
    }
  };

  // Create a cache key for the current analysis
  const cacheKey = useMemo(() => {
    if (!analysisData?.symbol) return null;
    const timeframes = Object.keys(selectedTimeframes)
      .filter((tf) => selectedTimeframes[tf])
      .sort();
    return `${analysisData.symbol}-${timeframes.join(",")}-${selectedAIModel}`;
  }, [analysisData?.symbol, selectedTimeframes, selectedAIModel]);

  // Load from cache on mount
  useEffect(() => {
    if (initialSymbol) {
      const cachedKey = `${initialSymbol}-15m,1h,4h,1d-${selectedAIModel}`;
      const cached = analysisCache.get(cachedKey);
      if (cached) {
        setAnalysisData(cached);
        setShowCustomInput(false);
      } else {
        fetchComprehensiveAnalysis(initialSymbol);
      }
    }
  }, [initialSymbol, selectedAIModel]);

  // Save to cache when analysis data changes
  useEffect(() => {
    if (analysisData && cacheKey) {
      analysisCache.set(cacheKey, analysisData);
    }
  }, [analysisData, cacheKey]);

  const fetchComprehensiveAnalysis = async (symbolToAnalyze = customSymbol) => {
  if (!symbolToAnalyze) return;

  try {
    setLoading(true);
    setError(null);

    const timeframesToAnalyze = Object.keys(selectedTimeframes).filter(
      (tf) => selectedTimeframes[tf]
    );

    const cacheKey = `${symbolToAnalyze.toUpperCase()}-${timeframesToAnalyze
      .sort()
      .join(",")}-${selectedAIModel}`;
    const cached = analysisCache.get(cacheKey);

    if (cached) {
      setAnalysisData(cached);
      setShowCustomInput(false);
      setLoading(false);
      return;
    }

    const requestBody = {
      symbol: symbolToAnalyze.toUpperCase(),
      timeframes: timeframesToAnalyze,
      include_btc: includeBTC,
    };

    if (selectedAIModel && availableAIModels.includes(selectedAIModel)) {
      requestBody.ai_model = selectedAIModel;
    }

    const response = await fetch(`${API_URL}/comprehensive-analysis`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        'X-CSRF-TOKEN': Cookies.get('csrf_access_token')
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      // Detect plan limit error
      if (data.error?.includes("Daily analysis limit reached")) {
        setShowPlanLimitModal(true);
        return;
      }
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    setAnalysisData(data);
    setShowCustomInput(false);

    if (data.user_plan_info) {
      setUserPlanInfo((prev) => ({ ...prev, ...data.user_plan_info }));
    } 

    analysisCache.set(cacheKey, data);
  } catch (err) {
    console.error("Error fetching comprehensive analysis:", err);
    setError(err.message || "Failed to fetch analysis");
  } finally {
    setLoading(false);
  }
};


  // Memoized handlers to prevent re-renders
  const handleCustomAnalysis = useCallback(() => {
    if (!customSymbol.trim()) {
      setError("Please enter a trading pair symbol");
      return;
    }
    if (Object.values(selectedTimeframes).every((tf) => !tf)) {
      setError("Please select at least one timeframe");
      return;
    }
    fetchComprehensiveAnalysis();
  }, [customSymbol, selectedTimeframes, selectedAIModel]);

  const handleSymbolChange = useCallback((e) => {
    setCustomSymbol(e.target.value.toUpperCase());
  }, []);

  const handleTimeframeChange = useCallback((tf) => {
    setSelectedTimeframes((prev) => ({
      ...prev,
      [tf]: !prev[tf],
    }));
  }, []);

  const handleAIModelChange = useCallback((e) => {
    setSelectedAIModel(e.target.value);
  }, []);

  const handleIncludeBTCChange = (e) => {
    if (userPlanInfo?.user_plan !== 'free') {
      setIncludeBTC(e.target.checked);
    }
  };

  const parseAIAnalysis = (aiText, aiSignal = null) => {
    // If we have aiSignal (structured JSON), prioritize that
    if (aiSignal && typeof aiSignal === "object") {
      console.log("Using structured AI signal data:", aiSignal);
      return {
        sections: parseTextSections(aiText),
        jsonSummary: aiSignal,
        hasStructuredData: true,
      };
    }

    // Legacy text parsing for backward compatibility
    if (!aiText || typeof aiText !== "string") {
      console.warn("No AI text provided, checking for signal data");
      return {
        sections: {},
        jsonSummary: aiSignal,
        hasStructuredData: !!aiSignal,
      };
    }

    const sections = parseTextSections(aiText);

    // Try to extract JSON from text (fallback)
    let jsonSummary = null;
    const jsonPatterns = [
      /```json\n([\s\S]*?)\n```/,
      /```\n(\{[\s\S]*?\})\n```/,
      /(\{[\s\S]*?\})/,
    ];

    for (const pattern of jsonPatterns) {
      const jsonMatch = aiText.match(pattern);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          // Validate it looks like trading data
          if (parsed.entry_status || parsed.primary_signal) {
            jsonSummary = parsed;
            console.log("Extracted JSON from AI text:", jsonSummary);
            break;
          }
        } catch (e) {
          console.log("Failed to parse JSON match:", e);
          continue;
        }
      }
    }

    return {
      sections,
      jsonSummary: jsonSummary || aiSignal,
      hasStructuredData: !!(jsonSummary || aiSignal),
    };
  };

  console.log("Analysis Data: ", analysisData);

  const parseTextSections = (aiText) => {
    if (!aiText) return {};

    const sections = {};
    const lines = aiText.split("\n");
    let currentSection = "";
    let currentContent = [];

    for (const line of lines) {
      // Look for section headers
      if (line.match(/^#{1,3}\s*\*?\*?([^*#]+)\*?\*?/)) {
        // Save previous section
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join("\n").trim();
        }

        // Start new section
        currentSection = line
          .replace(/^#{1,3}\s*\*?\*?/, "")
          .replace(/\*?\*?\s*$/, "")
          .replace(/[📊🎯⚠️📈⏰🔄📌🚀💣🌍]/g, "")
          .trim();
        currentContent = [];
      } else if (line.trim() && currentSection) {
        // Skip JSON blocks in sections
        if (
          !line.trim().startsWith("{") &&
          !line.trim().startsWith("}") &&
          !line.trim().includes("```")
        ) {
          currentContent.push(line);
        }
      }
    }

    // Save the last section
    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent.join("\n").trim();
    }

    return sections;
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return "N/A";
    return typeof price === "number" ? price.toFixed(6) : "N/A";
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return "0.00";
    return typeof value === "number" ? value.toFixed(2) : "0.00";
  };

  const getSignalColor = (signal) => {
    if (!signal) return "text-gray-400";
    const signalStr = signal.toString().toUpperCase();
    if (signalStr.includes("BUY")) return "text-green-400";
    if (signalStr.includes("SELL")) return "text-red-400";
    return "text-yellow-400";
  };

  const getSignalBg = (signal) => {
    if (!signal) return "bg-gray-500/20";
    const signalStr = signal.toString().toUpperCase();
    if (signalStr.includes("BUY")) return "bg-green-500/20";
    if (signalStr.includes("SELL")) return "bg-red-500/20";
    return "bg-yellow-500/20";
  };

  const safeGet = (obj, path, defaultValue = null) => {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined
        ? current[key]
        : defaultValue;
    }, obj);
  };

  if (loading) {
    return <EngagingCryptoLoader initialSymbol={initialSymbol} />;
  }

  if (error) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center mb-6"
          >
            <h1 className="text-2xl font-bold text-white">Analysis Error</h1>
            {userPlanInfo && (
              <PlanBadge plan={userPlanInfo.user_plan} className="ml-4" />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center text-red-400 mb-2">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span className="font-semibold">Analysis Failed</span>
            </div>
            <p className="text-red-300 mb-4">{error}</p>
            <div className="space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchComprehensiveAnalysis()}
                className="bg-red-500/30 hover:bg-red-500/40 text-red-300 px-4 py-2 rounded-lg transition-colors"
              >
                Retry Analysis
              </motion.button>
            </div>
          </motion.div>

          <CustomInputSection
            customSymbol={customSymbol}
            selectedTimeframes={selectedTimeframes}
            selectedAIModel={selectedAIModel}
            availableAIModels={availableAIModels}
            userPlanInfo={userPlanInfo}
            loading={loading}
            analysisData={analysisData}
            handleCustomAnalysis={handleCustomAnalysis}
            handleSymbolChange={handleSymbolChange}
            handleTimeframeChange={handleTimeframeChange}
            handleAIModelChange={handleAIModelChange}
          />
        </div>
      </div>
    );
  }

  if(showPlanLimitModal){
    return <PlanLimitModal isOpen={showPlanLimitModal} onClose={() => setShowPlanLimitModal(false)} currentPlan={userPlanInfo?.user_plan} />
  }

  if (showCustomInput || !analysisData) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <h1 className="text-3xl font-bold text-white">Custom Analysis</h1>
            {userPlanInfo && <PlanBadge plan={userPlanInfo.user_plan} />}
          </motion.div>

          <CustomInputSection
            customSymbol={customSymbol}
            selectedTimeframes={selectedTimeframes}
            selectedAIModel={selectedAIModel}
            availableAIModels={availableAIModels}
            userPlanInfo={userPlanInfo}
            loading={loading}
            analysisData={analysisData}
            handleCustomAnalysis={handleCustomAnalysis}
            handleSymbolChange={handleSymbolChange}
            handleTimeframeChange={handleTimeframeChange}
            handleAIModelChange={handleAIModelChange}
            includeBTC={includeBTC}
            handleIncludeBTCChange={handleIncludeBTCChange}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-gray-400"
          >
            Or Perform a{" "}
            <Link
              to="/dashboard"
              className="text-orange-400 hover:text-orange-300 font-medium transition-colors"
            >
              Quick Scan
            </Link>{" "}
            to get a quick overview of the market context and sentiment.
          </motion.p>
        </div>
      </div>
    );
  }

  const {
    market_context,
    multi_timeframe_analysis,
    ai_analysis,
    ai_signal,
    user_plan_info,
    plan_limitations_applied,
    btc_influence,
  } = analysisData || {};

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl font-bold text-white"
              >
                {analysisData.symbol} Analysis
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-400 flex items-center mt-2"
              >
                Comprehensive AI-powered trading analysis
                {plan_limitations_applied?.timeframes_filtered && (
                  <span className="ml-2 text-orange-400 text-sm">
                    (Timeframes limited by plan)
                  </span>
                )}
              </motion.p>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-4"
          >
            {user_plan_info && (
              <PlanBadge
                plan={user_plan_info.plan || userPlanInfo?.user_plan}
              />
            )}
            <motion.button
              whileHover={{
                scale: 1.05,
                backgroundColor: "rgba(251, 146, 60, 0.1)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCustomInput(true)}
              className="flex items-center text-orange-400 hover:text-orange-300 transition-colors px-4 py-2 rounded-lg border border-orange-400/30 hover:border-orange-300/50"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Analysis
            </motion.button>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Updated</p>
              <p className="text-white font-medium">
                {analysisData.timestamp
                  ? new Date(analysisData.timestamp).toLocaleTimeString()
                  : "Now"}
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Plan Limitations Warning */}
        {plan_limitations_applied &&
          (plan_limitations_applied.timeframes_filtered ||
            plan_limitations_applied.tp_levels_limited) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-orange-500/10 border border-orange-400/30 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center text-orange-400 mb-2">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span className="font-semibold">Plan Limitations Applied</span>
              </div>
              <ul className="text-orange-300 text-sm space-y-1">
                {plan_limitations_applied.timeframes_filtered && (
                  <li>• Some timeframes were filtered based on your plan</li>
                )}
                {plan_limitations_applied.tp_levels_limited && (
                  <li>• Take profit levels limited based on your plan</li>
                )}
              </ul>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="mt-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Upgrade for Full Access
              </motion.button>
            </motion.div>
          )}

        {/* Market Context */}
        {market_context && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -2 }}
            className="bg-gradient-to-r from-gray-800/60 to-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/30 mb-6 shadow-xl"
          >
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-semibold text-white mb-4 flex items-center"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <BarChart3 className="w-6 h-6 mr-3 text-blue-400" />
              </motion.div>
              Market Context
            </motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
                className="text-center bg-gray-700/30 rounded-xl p-4"
              >
                <p className="text-gray-300 text-sm font-medium mb-2">
                  Current Price
                </p>
                <p className="text-2xl font-bold text-white">
                  ${formatPrice(safeGet(market_context, "current_price"))}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                className="text-center bg-gray-700/30 rounded-xl p-4"
              >
                <p className="text-gray-300 text-sm font-medium mb-2">
                  24h Change
                </p>
                <motion.p
                  whileHover={{ scale: 1.1 }}
                  className={`text-2xl font-bold flex items-center justify-center ${
                    safeGet(market_context, "price_change_24h", 0) >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {safeGet(market_context, "price_change_24h", 0) >= 0 ? (
                    <TrendingUp className="w-5 h-5 mr-1" />
                  ) : (
                    <TrendingDown className="w-5 h-5 mr-1" />
                  )}
                  {safeGet(market_context, "price_change_24h", 0) >= 0
                    ? "+"
                    : ""}
                  {formatPercentage(
                    safeGet(market_context, "price_change_24h")
                  )}
                  %
                </motion.p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                className="text-center bg-gray-700/30 rounded-xl p-4"
              >
                <p className="text-gray-300 text-sm font-medium mb-2">
                  24h Volume
                </p>
                <p className="text-2xl font-bold text-white">
                  {safeGet(market_context, "volume_24h")?.toLocaleString() ||
                    "N/A"}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                className="text-center bg-gray-700/30 rounded-xl p-4"
              >
                <p className="text-gray-300 text-sm font-medium mb-2">Spread</p>
                <p className="text-2xl font-bold text-white">
                  {formatPercentage(safeGet(market_context, "bid_ask_spread"))}%
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* BTC Influence Analysis */}
        {includeBTC && btc_influence && (
          <BTCInfluenceSection analysisData={btc_influence} />
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">
                  BTC Market Influence Explained
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close modal"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* BTC Regime */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    BTC Regime
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    The current market environment for Bitcoin, which affects
                    how other cryptocurrencies behave. Common regimes include
                    "Bull Market" (rising prices), "Bear Market" (falling
                    prices), "Sideways" (consolidation), or "High Volatility"
                    (unstable conditions).
                  </p>
                </div>

                {/* Correlation */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Correlation
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-2">
                    Measures how closely this asset's price movements follow
                    Bitcoin's movements. The value ranges from -1 to +1:
                  </p>
                  <ul className="text-gray-300 text-sm space-y-1 ml-4">
                    <li>
                      • <span className="text-green-400">+1.0</span>: Perfect
                      positive correlation (moves exactly with BTC)
                    </li>
                    <li>
                      • <span className="text-yellow-400">0.0</span>: No
                      correlation (independent movement)
                    </li>
                    <li>
                      • <span className="text-red-400">-1.0</span>: Perfect
                      negative correlation (moves opposite to BTC)
                    </li>
                    <li>
                      • <span className="text-blue-400">0.7+</span>: Strong
                      positive correlation
                    </li>
                    <li>
                      • <span className="text-gray-400">0.3-0.7</span>: Moderate
                      correlation
                    </li>
                    <li>
                      • <span className="text-purple-400">&lt;0.3</span>: Weak
                      correlation
                    </li>
                  </ul>
                </div>

                {/* Beta */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Beta
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-2">
                    Measures the asset's volatility relative to Bitcoin. It
                    shows how much the asset's price typically moves when
                    Bitcoin moves by 1%:
                  </p>
                  <ul className="text-gray-300 text-sm space-y-1 ml-4">
                    <li>
                      • <span className="text-white">Beta = 1.0</span>: Moves
                      same amount as Bitcoin
                    </li>
                    <li>
                      • <span className="text-red-400">Beta &gt; 1.0</span>:
                      More volatile than Bitcoin (amplified moves)
                    </li>
                    <li>
                      • <span className="text-green-400">Beta &lt; 1.0</span>:
                      Less volatile than Bitcoin (dampened moves)
                    </li>
                    <li>
                      • <span className="text-yellow-400">Beta = 1.5</span>: If
                      BTC moves 10%, this asset typically moves 15%
                    </li>
                    <li>
                      • <span className="text-blue-400">Beta = 0.5</span>: If
                      BTC moves 10%, this asset typically moves 5%
                    </li>
                  </ul>
                </div>

                {/* Influence Level */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Influence Level
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-2">
                    An overall assessment of how much Bitcoin affects this
                    asset's price movements:
                  </p>
                  <ul className="text-gray-300 text-sm space-y-1 ml-4">
                    <li>
                      • <span className="text-red-400">High</span>: Strongly
                      influenced by Bitcoin movements
                    </li>
                    <li>
                      • <span className="text-yellow-400">Moderate</span>:
                      Somewhat influenced by Bitcoin
                    </li>
                    <li>
                      • <span className="text-green-400">Low</span>: Relatively
                      independent from Bitcoin
                    </li>
                    <li>
                      • <span className="text-gray-400">Minimal</span>: Very
                      little Bitcoin influence
                    </li>
                  </ul>
                </div>

                {/* Trading Implications */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Trading Implications
                  </h3>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <p className="text-gray-300 text-sm leading-relaxed mb-2">
                      <span className="text-yellow-400 font-medium">
                        High Correlation + High Beta:
                      </span>{" "}
                      Asset amplifies Bitcoin's moves - higher risk, higher
                      reward potential.
                    </p>
                    <p className="text-gray-300 text-sm leading-relaxed mb-2">
                      <span className="text-green-400 font-medium">
                        Low Correlation:
                      </span>{" "}
                      Asset may provide diversification benefits in a crypto
                      portfolio.
                    </p>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      <span className="text-blue-400 font-medium">
                        Changing Correlations:
                      </span>{" "}
                      Watch for regime changes that might signal new market
                      dynamics.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-700">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Multi-Timeframe Analysis */}
        {multi_timeframe_analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -2 }}
            className="bg-gradient-to-r from-gray-800/60 to-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/30 mb-6 shadow-xl"
          >
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-semibold text-white mb-4 flex items-center"
            >
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.4 }}
              >
                <Clock className="w-6 h-6 mr-3 text-purple-400" />
              </motion.div>
              Multi-Timeframe Analysis
              {plan_limitations_applied?.timeframes_filtered && (
                <span className="ml-2 text-orange-400 text-sm">
                  (Plan Limited)
                </span>
              )}
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(multi_timeframe_analysis).map(
                ([timeframe, data], index) => (
                  <motion.div
                    key={timeframe}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="bg-gray-700/40 rounded-xl p-4 border border-gray-600/20"
                  >
                    <motion.h3
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="text-lg font-semibold text-white mb-3"
                    >
                      {timeframe.toUpperCase()}
                    </motion.h3>

                    <div className="space-y-3">
                      {/* Coin Stats */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">Signal:</span>
                        <motion.span
                          whileHover={{ scale: 1.1 }}
                          className={`text-sm font-bold px-2 py-1 rounded 
                          ${getSignalBg(
                            safeGet(data, "analysis.overall_signal.signal")
                          )} 
                          ${getSignalColor(
                            safeGet(data, "analysis.overall_signal.signal")
                          )}`}
                        >
                          {safeGet(
                            data,
                            "analysis.overall_signal.signal",
                            "N/A"
                          )}
                        </motion.span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">
                          Confidence:
                        </span>
                        <span className="text-white text-sm font-medium">
                          {safeGet(
                            data,
                            "analysis.overall_signal.confidence"
                          )?.toFixed(1) || "N/A"}
                          %
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">RSI:</span>
                        <span className="text-white text-sm font-medium">
                          {safeGet(data, "latest.rsi_14")?.toFixed(1) ||
                            "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">Trend:</span>
                        <span className="text-white text-sm font-medium">
                          {safeGet(
                            data,
                            "analysis.trend_analysis.strength",
                            "N/A"
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-300 text-sm">Momentum:</span>
                        <span className="text-white text-sm font-medium">
                          {safeGet(
                            data,
                            "analysis.momentum_analysis.strength",
                            "N/A"
                          )}
                        </span>
                      </div>

                      {/* BTC Market Influence */}
                      {includeBTC && safeGet(data, "analysis.btc_influence") && (
                        <div className="pt-4 border-t border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="block text-gray-400 text-xs uppercase tracking-wider">
                              BTC Market Influence
                            </span>
                            <button
                              onClick={() => setShowModal(true)}
                              className="text-gray-400 hover:text-white transition-colors"
                              aria-label="BTC Market Influence Information"
                            >
                              <Info size={14} />
                            </button>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-300 text-sm">BTC Regime:</span>
                            <span className="text-white text-sm font-medium">
                              {formatLabel(safeGet(data, "analysis.btc_influence.btc_regime"))}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-300 text-sm">Correlation:</span>
                            <span className="text-white text-sm font-medium">
                              {(
                                safeGet(data, "analysis.btc_influence.correlation_strength") || 0
                              ).toFixed(2)}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-300 text-sm">Beta:</span>
                            <span className="text-white text-sm font-medium">
                              {safeGet(data, "analysis.btc_influence.beta")?.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-300 text-sm">Influence:</span>
                            <span className="text-white text-sm font-medium">
                              {formatLabel(
                                safeGet(data, "analysis.btc_influence.influence_level")
                              )}
                            </span>
                          </div>

                          {/* Highlighted opportunity */}
                          {safeGet(data, "analysis.btc_influence.opportunities[0]") && (
                            <div className="mt-2 text-xs text-green-400 italic">
                              {safeGet(data, "analysis.btc_influence.opportunities[0]")}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </motion.div>
                )
              )}
            </div>
          </motion.div>
        )}

        {/* Enhanced AI Analysis */}
        {(ai_analysis || ai_signal) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-gray-800/60 to-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/30 shadow-xl"
          >
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold text-white mb-6 flex items-center justify-between"
            >
              {user_plan_info && (
                <div className="flex items-center gap-2">
                  <PlanBadge
                    plan={user_plan_info.plan || userPlanInfo?.user_plan}
                  />
                  {selectedAIModel && (
                    <div className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                      {selectedAIModel.includes("deepseek")
                        ? "DeepSeek"
                        : selectedAIModel.includes("claude")
                        ? "Claude"
                        : selectedAIModel.includes("gpt-4")
                        ? "GPT-4"
                        : "AI Model"}
                    </div>
                  )}
                </div>
              )}
            </motion.h2>

            <AIAnalysisSection
              aiAnalysis={ai_analysis}
              aiSignal={ai_signal}
              userPlanInfo={userPlanInfo}
              selectedAIModel={selectedAIModel}
              parseAIAnalysis={parseAIAnalysis}
              getSignalBg={getSignalBg}
              getSignalColor={getSignalColor}
              formatEntryStatus={formatEntryStatus}
            />
          </motion.div>
        )}

        {/* No AI Analysis Warning */}
        {!ai_analysis && !ai_signal && analysisData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-500/10 border border-orange-400/30 rounded-xl p-6"
          >
            <div className="flex items-center text-orange-400 mb-2">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span className="font-semibold">AI Analysis Unavailable</span>
            </div>
            <p className="text-orange-300 mb-4">
              The AI analysis could not be generated or processed. Technical
              analysis is still available above.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => fetchComprehensiveAnalysis()}
              className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 px-4 py-2 rounded-lg transition-colors"
            >
              Retry AI Analysis
            </motion.button>
          </motion.div>
        )}

        {/* Upgrade Prompts for Free Users */}
        {userPlanInfo?.user_plan === "free" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <UpgradePrompt
              title="Want More Trading Power?"
              description="Upgrade to Premium for 5 trading pairs, 20 scans/hour, 2 TP levels, and access to Claude AI model."
              targetPlan="premium"
            />
          </motion.div>
        )}

        {userPlanInfo?.user_plan === "premium" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <UpgradePrompt
              title="Unlock Full AI Insights"
              description="Upgrade to Pro to see complete AI reasoning, access all AI models, and get 3 TP levels with unlimited pairs."
              targetPlan="pro"
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ComprehensiveAnalysis;
