import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Activity, TrendingUp, TrendingDown, AlertTriangle, Plus, X, Search, Crown, Shield, 
  Star, Zap, Lock, CheckCircle, Play, ArrowRight, Target, Eye, BarChart3, RefreshCw
} from "lucide-react";
import MarketOverview from "./DashboardComps/MarketOverview";
import AISignals from "./DashboardComps/AISignals";
import PerformanceAnalysis from "./DashboardComps/PerformanceAnalysis";
import RiskAnalysis from "./DashboardComps/RiskAnalysis";
import PairSelectionModal from "./DashboardComps/PairSelectionModal";
import UpgradeModal from "./DashboardComps/UpgradeModal";
import Cookies from 'js-cookie';

const API_URL =
  import.meta.env.VITE_REACT_APP_API || "http://localhost:5000/api";

// Plan configurations
const PLAN_CONFIGS = {
  free: {
    name: "Free",
    maxPairs: 1,
    color: "gray",
    icon: Star,
    features: ["1 pair scan", "Basic signals", "5m-1h timeframes"],
  },
  premium: {
    name: "Premium",
    maxPairs: 5,
    color: "orange",
    icon: Zap,
    features: [
      "5 pairs scan",
      "Advanced signals",
      "All timeframes",
      "Risk analysis",
    ],
  },
  pro: {
    name: "Pro",
    maxPairs: 20,
    color: "purple",
    icon: Crown,
    features: [
      "20 pairs scan",
      "Premium signals",
      "All features",
      "Priority support",
    ],
  },
};

// Popular crypto pairs organized by category
const CRYPTO_PAIRS = {
  major: [ "BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "XRPUSDT", "SOLUSDT", "DOGEUSDT", "DOTUSDT", "MATICUSDT", "AVAXUSDT"],
  defi: [ "AAVEUSDT", "UNIUSDT", "LINKUSDT", "MKRUSDT", "COMPUSDT", "YFIUSDT", "SNXUSDT", "CRVUSDT", "BALUSDT", "RENUSDT"],
  altcoins: [ "LTCUSDT", "ETCUSDT", "XLMUSDT", "VETUSDT", "FILUSDT", "TRXUSDT", "EOSUSDT", "KNCUSDT", "ZRXUSDT", "ATOMUSDT"],
};

// Tutorial steps configuration
const TUTORIAL_STEPS = [
  {
    id: "welcome",
    title: "Welcome to AI Trading Dashboard",
    content:
      "This dashboard helps you find high-potential crypto opportunities using AI analysis. Let's take a quick tour!",
    position: "center",
    icon: <Target className="w-6 h-6" />,
  },
  {
    id: "market-overview",
    title: "Market Overview Cards",
    content:
      "Monitor the big 4 coins (BTC, ETH, BNB, SOL) in real-time. These cards show current prices, 24h changes, and trends.",
    target: ".market-overview",
    position: "bottom",
    icon: <Eye className="w-5 h-5" />,
  },
  {
    id: "pair-selection",
    title: "Select Trading Pairs",
    content:
      "Choose which cryptocurrency pairs you want to analyze. Your plan determines how many pairs you can scan simultaneously.",
    target: ".pair-selector",
    position: "bottom",
    icon: <Plus className="w-5 h-5" />,
  },
  {
    id: "scan-button",
    title: "AI Signal Scanner",
    content:
      'This is the magic button! Click "Scan Signals" to run AI analysis on your selected pairs. It analyzes technical indicators and market conditions.',
    target: ".scan-button",
    position: "left",
    icon: <Zap className="w-5 h-5" />,
    highlight: true,
  },
  {
    id: "results",
    title: "Trading Signals",
    content:
      "After scanning, you'll see AI-generated signals with confidence levels, risk analysis, and market conditions for each pair.",
    target: ".signals-results",
    position: "top",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    id: "analyze-button",
    title: "Deep Analysis",
    content:
      'Click "Analyze" on any signal to get comprehensive AI analysis with detailed insights, charts, and trading recommendations.',
    target: ".analyze-button",
    position: "left",
    icon: <Activity className="w-5 h-5" />,
  },
  {
    id: "performance",
    title: "Performance & Risk Overview",
    content:
      "These panels show your scanning results summary - signal distribution, confidence levels, and risk analysis to help guide your decisions.",
    target: ".analysis-panels",
    position: "top",
    icon: <Shield className="w-5 h-5" />,
  },
];

// Updated TutorialTooltip component that uses absolute positioning via style prop
const TutorialTooltip = ({
  step,
  onNext,
  onPrev,
  onClose,
  currentIndex,
  totalSteps,
  style,
}) => {
  const isCenter = step.position === "center";

  return (
    <motion.div
      className={`${
        isCenter ? "fixed inset-0 flex items-center justify-center" : "fixed"
      } z-[60] pointer-events-none`}
      style={isCenter ? {} : style}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative bg-gray-900 border border-orange-500/30 rounded-xl p-4 shadow-2xl max-w-sm pointer-events-auto">
        {/* Arrow for positioned tooltips */}
        {!isCenter && (
          <div
            className={`
            absolute w-3 h-3 bg-gray-900 border-orange-500/30 rotate-45
            ${
              step.position === "top"
                ? "top-full -mt-1.5 border-b border-r left-1/2 -translate-x-1/2"
                : ""
            }
            ${
              step.position === "bottom"
                ? "bottom-full -mb-1.5 border-t border-l left-1/2 -translate-x-1/2"
                : ""
            }
            ${
              step.position === "left"
                ? "left-full -ml-1.5 border-t border-r top-1/2 -translate-y-1/2"
                : ""
            }
            ${
              step.position === "right"
                ? "right-full -mr-1.5 border-b border-l top-1/2 -translate-y-1/2"
                : ""
            }
          `}
          />
        )}

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-orange-500/20 rounded-lg">
            {step.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white mb-2">{step.title}</h3>
            <p className="text-gray-300 text-sm mb-4">{step.content}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i === currentIndex ? "bg-orange-500" : "bg-gray-600"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {currentIndex > 0 && (
                  <button
                    onClick={onPrev}
                    className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Back
                  </button>
                )}
                {currentIndex < totalSteps - 1 ? (
                  <button
                    onClick={onNext}
                    className="flex items-center gap-1 px-3 py-1 bg-orange-500 hover:bg-orange-600 rounded text-sm font-medium transition-colors"
                  >
                    Next <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="flex items-center gap-1 px-3 py-1 bg-green-500 hover:bg-green-600 rounded text-sm font-medium transition-colors"
                  >
                    <CheckCircle className="w-3 h-3" /> Got it!
                  </button>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard = ({ onAnalyzeSymbol }) => {
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState(true);
  const [scannedSymbols, setScannedSymbols] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [timeframe, setTimeframe] = useState("1h");
  const [minScore, setMinScore] = useState(0.5);
  const [selectedPairs, setSelectedPairs] = useState(["BTCUSDT"]);
  const [showPairSelector, setShowPairSelector] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanMessage, setScanMessage] = useState(
    "Click Scan Signals to analyze selected pairs"
  );

  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [highlightStyle, setHighlightStyle] = useState({ display: "none" });

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userPlan = user.tier || "free";
  const planConfig = PLAN_CONFIGS[userPlan];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, staggerChildren: 0.08, ease: "easeOut" },
    },
  };
  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  // --- Tutorial Logic ---
  const startTutorial = () => {
    setCurrentStep(0);
    setShowTutorial(true);
  };
  const nextStep = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1)
      setCurrentStep(currentStep + 1);
  };
  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };
  const closeTutorial = () => {
    setShowTutorial(false);
  };
  const currentTutorialStep = TUTORIAL_STEPS[currentStep];

  useEffect(() => {
    const calculatePosition = () => {
      if (!showTutorial || !currentTutorialStep) {
        setHighlightStyle({ display: "none" });
        setTooltipStyle({ display: "none" });
        return;
      }

      const step = currentTutorialStep;

      if (step.target) {
        const targetElement = document.querySelector(step.target);
        if (targetElement) {
          const rect = targetElement.getBoundingClientRect();

          setHighlightStyle({
            position: "fixed",
            top: `${rect.top - 4}px`,
            left: `${rect.left - 4}px`,
            width: `${rect.width + 8}px`,
            height: `${rect.height + 8}px`,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7)",
            border: "2px solid #F97316",
            borderRadius: "8px",
            zIndex: 55,
            pointerEvents: "none",
            transition: "top 0.3s, left 0.3s, width 0.3s, height 0.3s",
          });

          const tooltipWidth = 320;
          const tooltipHeight = 180;
          const gap = 12;
          let newStyle = {
            position: "fixed",
            zIndex: 60,
            transition: "top 0.3s, left 0.3s",
          };

          switch (step.position) {
            case "top":
              newStyle.top = `${rect.top - tooltipHeight - gap}px`;
              newStyle.left = `${
                rect.left + rect.width / 2 - tooltipWidth / 2
              }px`;
              break;
            case "bottom":
              newStyle.top = `${rect.bottom + gap}px`;
              newStyle.left = `${
                rect.left + rect.width / 2 - tooltipWidth / 2
              }px`;
              break;
            case "left":
              newStyle.top = `${
                rect.top + rect.height / 2 - tooltipHeight / 2
              }px`;
              newStyle.left = `${rect.left - tooltipWidth - gap}px`;
              break;
            case "right":
              newStyle.top = `${
                rect.top + rect.height / 2 - tooltipHeight / 2
              }px`;
              newStyle.left = `${rect.right + gap}px`;
              break;
            default:
              newStyle.top = `${rect.bottom + gap}px`;
              newStyle.left = `${
                rect.left + rect.width / 2 - tooltipWidth / 2
              }px`;
          }

          let parsedTop = parseFloat(newStyle.top);
          let parsedLeft = parseFloat(newStyle.left);
          if (parsedLeft < gap) parsedLeft = gap;
          if (parsedLeft + tooltipWidth > window.innerWidth - gap)
            parsedLeft = window.innerWidth - tooltipWidth - gap;
          if (parsedTop < gap) parsedTop = gap;
          if (parsedTop + tooltipHeight > window.innerHeight - gap)
            parsedTop = window.innerHeight - tooltipHeight - gap;

          newStyle.top = `${parsedTop}px`;
          newStyle.left = `${parsedLeft}px`;
          setTooltipStyle(newStyle);
        } else {
          setHighlightStyle({ display: "none" });
          setTooltipStyle({ display: "none" });
        }
      } else {
        setHighlightStyle({ display: "none" });
        setTooltipStyle({});
      }
    };

    calculatePosition();
    if (showTutorial) {
      window.addEventListener("resize", calculatePosition);
      document.addEventListener("scroll", calculatePosition, true);
      return () => {
        window.removeEventListener("resize", calculatePosition);
        document.removeEventListener("scroll", calculatePosition, true);
      };
    }
  }, [currentStep, showTutorial, currentTutorialStep]);

  // --- Core Component Logic ---
  const determineTrend = (change) => {
    if (change > 0.5) return "bullish";
    if (change < -0.5) return "bearish";
    return "neutral";
  };
  const formatNumber = (num) =>
    num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const togglePairSelection = (pair) => {
    if (selectedPairs.includes(pair))
      setSelectedPairs((prev) => prev.filter((p) => p !== pair));
    else {
      if (selectedPairs.length >= planConfig.maxPairs) {
        setShowUpgradeModal(true);
        return;
      }
      setSelectedPairs((prev) => [...prev, pair]);
    }
  };

  const calculatePerformanceMetrics = () => {
    if (scannedSymbols.length === 0) return null;
    const totalSignals = scannedSymbols.length;
    const buySignals = scannedSymbols.filter((s) =>
      s.signal.includes("BUY")
    ).length;
    const sellSignals = scannedSymbols.filter((s) =>
      s.signal.includes("SELL")
    ).length;
    const avgConfidence =
      scannedSymbols.reduce((sum, s) => sum + s.confidence, 0) / totalSignals;
    const avgScore =
      scannedSymbols.reduce((sum, s) => sum + s.score, 0) / totalSignals;
    return {
      totalSignals,
      buySignals,
      sellSignals,
      avgConfidence: avgConfidence.toFixed(1),
      avgScore: avgScore.toFixed(2),
      strongSignals: scannedSymbols.filter((s) => s.signal.includes("STRONG"))
        .length,
      buyPercentage: ((buySignals / totalSignals) * 100).toFixed(1),
      sellPercentage: ((sellSignals / totalSignals) * 100).toFixed(1),
    };
  };

  const calculateRiskAnalysis = () => {
    if (scannedSymbols.length === 0) return null;
    const riskLevels = scannedSymbols.map((s) => s.risk_level);
    const lowRisk = riskLevels.filter((r) => r === "LOW").length;
    const mediumRisk = riskLevels.filter((r) => r === "MEDIUM").length;
    const highRisk = riskLevels.filter((r) => r === "HIGH").length;
    const marketConditions = scannedSymbols.map((s) => s.market_condition);
    const avgRsi =
      scannedSymbols
        .filter((s) => s.indicators?.rsi_14)
        .reduce((sum, s) => sum + s.indicators.rsi_14, 0) /
      scannedSymbols.length;
    return {
      lowRisk,
      mediumRisk,
      highRisk,
      bullishConditions: marketConditions.filter((c) => c.includes("UPTREND"))
        .length,
      bearishConditions: marketConditions.filter((c) => c.includes("DOWNTREND"))
        .length,
      neutralConditions: marketConditions.filter(
        (c) => !c.includes("UPTREND") && !c.includes("DOWNTREND")
      ).length,
      avgRsi: avgRsi.toFixed(1),
      overallRiskLevel:
        highRisk > lowRisk ? "HIGH" : mediumRisk > lowRisk ? "MEDIUM" : "LOW",
      totalSignals: scannedSymbols.length,
      riskScore: (
        ((highRisk * 3 + mediumRisk * 2 + lowRisk * 1) /
          (scannedSymbols.length * 3)) *
        100
      ).toFixed(0),
    };
  };

  useEffect(() => {
    const symbols = ["btcusdt", "ethusdt", "bnbusdt", "solusdt"];
    const socket = new WebSocket(
      `wss://stream.binance.com:9443/stream?streams=${symbols
        .map((s) => `${s}@ticker`)
        .join("/")}`
    );
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const data = message.data;
      setMarketData((prev) => ({
        ...prev,
        [data.s]: {
          price: parseFloat(data.c),
          change: parseFloat(data.P),
          trend: determineTrend(parseFloat(data.P)),
          last_updated: Date.now(),
        },
      }));
      setLoading(false);
    };
    return () => socket.close();
  }, []);

  const csrf = Cookies.get('csrf_access_token');
  const scanMultipleSymbols = async () => {
    try {
      setIsScanning(true);
      setHasScanned(true);
      setScanMessage("Scanning...");
      const res = await axios.post( `${API_URL}/scan`, {
          pairs: selectedPairs,
          timeframe: timeframe,
          min_opportunity_score: minScore,
        }, 
        { 
          withCredentials: true,
          headers: {
            'X-CSRF-TOKEN': Cookies.get('csrf_access_token')
          },
        },
      );
      const opportunities = res.data?.opportunities || [];
      setScannedSymbols(opportunities);
      if (opportunities.length === 0)
        setScanMessage("No signals found for the selected pairs.");
      else setScanMessage("");
    } catch (error) {
      console.error("Error scanning symbols:", error);
      setScannedSymbols([]);
      setScanMessage("Error scanning for signals. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const performanceMetrics = calculatePerformanceMetrics();
  const riskAnalysis = calculateRiskAnalysis();
  const handleAnalyzeClick = (symbol) => {
    if (onAnalyzeSymbol) onAnalyzeSymbol(symbol, timeframe);
  };

  if (loading || Object.keys(marketData).length === 0) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center"
        >
          <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
          <span className="ml-3 text-gray-300">Loading dashboard...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && (
          <>
            <motion.div
              style={highlightStyle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
            <TutorialTooltip
              step={currentTutorialStep}
              onNext={nextStep}
              onPrev={prevStep}
              onClose={closeTutorial}
              currentIndex={currentStep}
              totalSteps={TUTORIAL_STEPS.length}
              style={tooltipStyle}
            />
          </>
        )}
      </AnimatePresence>

      <motion.div
        className="p-4 space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30"
          variants={itemVariants}
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Welcome back, {user?.name || "Trader"}
            </h1>
            <p className="text-gray-400">
              Here's what's happening with your AI signals today.
            </p>
            <div className="flex items-center mt-2 space-x-2">
              <planConfig.icon
                className={`w-4 h-4 text-${planConfig.color}-400`}
              />
              <span
                className={`text-${planConfig.color}-400 font-medium text-sm`}
              >
                {planConfig.name} Plan
              </span>
              <span className="text-gray-500 text-sm">
                ({selectedPairs.length}/{planConfig.maxPairs} pairs)
              </span>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-orange-500/90 hover:bg-orange-600 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 shadow-lg"
            >
              New Signal
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="border border-gray-600 hover:border-gray-500 bg-gray-800/50 hover:bg-gray-700/50 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
              onClick={startTutorial}
            >
              Tutorial
            </motion.button>
          </div>
        </motion.div>

        {/* Added wrapper for tutorial target */}
        <div className="market-overview">
          <MarketOverview
            marketData={marketData}
            formatNumber={formatNumber}
            formatTime={formatTime}
            itemVariants={itemVariants}
          />
        </div>

        <AISignals
          selectedPairs={selectedPairs}
          planConfig={planConfig}
          setShowPairSelector={setShowPairSelector}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          minScore={minScore}
          setMinScore={setMinScore}
          scanMultipleSymbols={scanMultipleSymbols}
          isScanning={isScanning}
          scannedSymbols={scannedSymbols}
          handleAnalyzeClick={handleAnalyzeClick}
          togglePairSelection={togglePairSelection}
          hasScanned={hasScanned}
          scanMessage={scanMessage}
        />

        {/* Added class for tutorial target */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 analysis-panels"
          variants={containerVariants}
        >
          <PerformanceAnalysis
            performanceMetrics={performanceMetrics}
            itemVariants={itemVariants}
          />
          <RiskAnalysis
            riskAnalysis={riskAnalysis}
            itemVariants={itemVariants}
          />
        </motion.div>

        <PairSelectionModal
          showPairSelector={showPairSelector}
          setShowPairSelector={setShowPairSelector}
          selectedPairs={selectedPairs}
          togglePairSelection={togglePairSelection}
          planConfig={planConfig}
          CRYPTO_PAIRS={CRYPTO_PAIRS}
        />
        <UpgradeModal
          showUpgradeModal={showUpgradeModal}
          setShowUpgradeModal={setShowUpgradeModal}
          userPlan={userPlan}
          PLAN_CONFIGS={PLAN_CONFIGS}
        />
      </motion.div>
    </>
  );
};

export default Dashboard;
