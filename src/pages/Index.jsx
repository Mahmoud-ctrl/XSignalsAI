import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  TrendingUp, Zap, Shield, Target, ChevronRight, Play, Users, Award, Clock, Bot, Star, 
  CheckCircle, XCircle, ArrowRight, Sparkles, Brain, Eye, Layers, Activity, Gauge,
  BarChart3, LineChart, PieChart, Signal, Wifi, Database, Server, Globe as GlobeIcon,
  Twitter, Facebook, Linkedin
} from "lucide-react"
import { Link } from "react-router-dom"

export default function Index() {
  const [activeFeature, setActiveFeature] = useState(0)
  const [livePrices, setLivePrices] = useState([
    { symbol: "BTC/USD", price: "61,493.37", change: "+2.47%", changeType: "up" },
    { symbol: "ETH/USD", price: "3,247.82", change: "-1.23%", changeType: "down" },
    { symbol: "SOL/USD", price: "142.56", change: "+5.91%", changeType: "up" },
    { symbol: "ADA/USD", price: "0.4321", change: "+3.12%", changeType: "up" }
  ])
  const [pricingPlan, setPricingPlan] = useState('monthly');

  // Simulate live price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePrices(prev => prev.map(price => ({
        ...price,
        price: (parseFloat(price.price.replace(/,/g, '')) + (Math.random() - 0.5) * 100).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      })))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Framer Motion variants for animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  const stats = [
    { value: "100+", label: "Technical Indicators Analyzed", icon: BarChart3 },
    { value: "Real-Time", label: "Sentiment Analysis", icon: Sparkles },
    { value: "In-Depth", label: "Comprehensive Reports", icon: Layers },
    { value: "24/7", label: "Market Monitoring", icon: Clock },
  ]

  const features = [
    {
      title: "Multi-Factor AI Analysis",
      description:
        "Our proprietary AI processes thousands of data points in real-time, from market sentiment to complex technical indicators, identifying high-probability opportunities with surgical precision.",
      icon: Brain,
      gradient: "from-purple-500/20 to-blue-500/20",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
      details: [
        "Real-time sentiment analysis",
        "Technical pattern recognition",
        "Volume flow analysis",
        "Market correlation mapping",
      ],
    },
    {
      title: "Dynamic Strategy Adaptation",
      description:
        "The core AI continuously learns and adapts its strategies to changing market conditions, ensuring optimal performance whether the market is bullish, bearish, or sideways.",
      icon: Activity,
      gradient: "from-green-500/20 to-teal-500/20",
      image: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=500&h=300&fit=crop",
      details: [
        "Machine learning optimization",
        "Market regime detection",
        "Strategy backtesting",
        "Performance analytics",
      ],
    },
    {
      title: "AI-Calculated Risk Management",
      description:
        "Every signal includes AI-determined parameters for stop-loss and take-profit, designed to maximize your risk-to-reward ratio and protect your capital.",
      icon: Shield,
      gradient: "from-orange-500/20 to-red-500/20",
      image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&h=300&fit=crop",
      details: [
        "Dynamic position sizing",
        "Risk-reward optimization",
        "Portfolio correlation analysis",
        "Drawdown protection",
      ],
    },
  ]

  const howItWorksSteps = [
    {
      step: 1,
      title: "Get Pro Trial Account",
      description: "Sign up for a free account and automatically receive a Pro trial to experience all features.",
      icon: Target,
      color: "text-blue-400",
      image: "https://placehold.co/400x250/000000/FFFFFF?text=Step+1",
    },
    {
      step: 2,
      title: "Scan & Analyze",
      description: "Use your Pro trial to scan multiple crypto pairs and analyze opportunities with AI-powered insights.",
      icon: Layers,
      color: "text-green-400",
      image: "https://placehold.co/400x250/000000/FFFFFF?text=Step+2",
    },
    {
      step: 3,
      title: "Trade with AI Precision",
      description: "Receive real-time, actionable signals with clear entry points, targets, and stop-loss levels.",
      icon: Gauge,
      color: "text-orange-400",
      image: "https://placehold.co/400x250/000000/FFFFFF?text=Step+3",
    },
  ];

  const pricingTiers = {
    monthly: [
      { name: 'Free', price: '0', originalPrice: null, features: ['1 Max Pair', '5 Scans/Hour', '1 Take Profit Level', 'Pre-selected AI Models', '& More...'] },
      { name: 'Premium', price: '19.99', originalPrice: '39.99', features: ['5 Max Pairs', '20 Scans/Hour', '2 Take Profit Levels', '2 AI Model Options', '& More...'], popular: true },
      { name: 'Pro', originalPrice: '59.99', price: '29.99', features: ['20 Max Pairs', '100 Scans/Hour', '3 Take Profit Levels', '5 AI Model Options', '& More...'] }
    ],
  };

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white overflow-x-hidden font-sans">
      <div className="relative pt-16 sm:pt-20">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2, delay: 1 }}
            className="absolute top-20 left-10 w-72 h-72 sm:w-96 sm:h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"
          ></motion.div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2, delay: 1.5 }}
            className="absolute bottom-20 right-10 w-72 h-72 sm:w-96 sm:h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></motion.div>
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[800px] sm:h-[800px] border border-orange-500/20 rounded-full animate-spin"
            style={{ animationDuration: "30s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] sm:w-[600px] sm:h-[600px] border border-orange-500/10 rounded-full animate-spin"
            style={{ animationDuration: "20s", animationDirection: "reverse" }}
          ></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-24 sm:pb-32">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center bg-gray-800/50 rounded-full px-4 py-2 mb-6 sm:mb-8 border border-gray-700 hover:border-orange-500/50 transition-all duration-300 transform hover:scale-105"
            >
              <Zap className="w-4 h-4 text-orange-400 mr-2 animate-pulse" />
              <span className="text-xs sm:text-sm text-gray-300">
                New AI Model v2.0 Released
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight"
            >
              Discover the
              <br />
              <span className="text-gray-400">AI-powered precision of</span>
              <br />
              <span className="text-orange-400">crypto signals</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl text-gray-400 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Transform your trading with cutting-edge AI algorithms that
              analyze market patterns 24/7. Join thousands of successful traders
              leveraging artificial intelligence for consistent profits.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12 sm:mb-16"
            >
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0px 0px 20px rgba(249, 115, 22, 0.25)",
                }}
                whileTap={{ scale: 0.95 }}
                className="bg-orange-500 hover:bg-orange-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg flex items-center transition-shadow duration-300 w-full sm:w-auto justify-center"
              >
                Start Your 7-Day Pro Trial
                <ChevronRight className="w-5 h-5 ml-2" />
              </motion.button>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="text-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    className="flex justify-center mb-2 cursor-pointer"
                  >
                    <stat.icon
                      className="w-6 h-6 text-orange-400 animate-bounce"
                      style={{
                        animationDelay: `${index * 0.2}s`,
                        animationDuration: "2s",
                      }}
                    />
                  </motion.div>
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Live Trading Dashboard Section */}
      <div
        id="trading-dashboard"
        className="py-16 sm:py-24 relative overflow-hidden"
      >
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm rounded-full mb-6 sm:mb-8 border border-green-500/30">
              <Activity className="w-5 h-5 text-green-400 mr-3" />
              <span className="text-green-300 font-medium text-sm sm:text-base">
                Live Trading Interface
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 sm:mb-8 text-white">
              Professional Trading
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                Dashboard
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
              Advanced analytics and real-time insights at your fingertips
            </p>
          </motion.div>

          {/* Trading Dashboard Interface */}
          <motion.div
            className="relative max-w-6xl mx-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-gray-700/50 overflow-hidden shadow-2xl">
              {/* Dashboard Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-700/50 gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Signal className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      SignalAI Pro
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400">
                      Advanced Trading Dashboard
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-400">Live</span>
                  </div>
                  <div className="bg-gray-800/50 px-3 sm:px-4 py-1 sm:py-2 rounded-lg">
                    <span className="text-sm text-gray-300">USD</span>
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6">
                {/* Live Prices Panel */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-800/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700/30">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h4 className="text-lg font-bold text-white">
                        Live Prices
                      </h4>
                      <Wifi className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      {livePrices.map((price, index) => (
                        <motion.div
                          key={price.symbol}
                          className="flex items-center justify-between p-3 bg-gray-700/20 rounded-xl hover:bg-gray-700/40 transition-colors duration-300"
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div>
                            <div className="font-medium text-white text-sm">
                              {price.symbol}
                            </div>
                            <div className="text-xs text-gray-400">Crypto</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-white text-sm">
                              ${price.price}
                            </div>
                            <div
                              className={`text-xs ${
                                price.changeType === "up"
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {price.change}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Performance Chart */}
                <div className="lg:col-span-2">
                  <div className="bg-gray-800/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700/30">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h4 className="text-lg font-bold text-white">
                        Portfolio Performance
                      </h4>
                      <div className="flex items-center space-x-2">
                        <LineChart className="w-5 h-5 text-orange-400" />
                        <span className="text-sm text-gray-400">24h</span>
                      </div>
                    </div>

                    {/* Simulated Chart Area */}
                    <div className="relative h-48 sm:h-64 bg-gradient-to-t from-gray-900/50 to-transparent rounded-xl overflow-hidden">
                      <div className="absolute inset-0 flex items-end justify-between px-2 sm:px-4 pb-2 sm:pb-4">
                        {[...Array(12)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-sm opacity-70"
                            style={{
                              height: `${30 + Math.random() * 60}%`,
                              width: "calc(100% / 15)",
                            }}
                            initial={{ height: 0 }}
                            animate={{ height: `${30 + Math.random() * 60}%` }}
                            transition={{ delay: i * 0.1, duration: 0.6 }}
                          />
                        ))}
                      </div>

                      {/* Chart overlay with trend line */}
                      <svg
                        className="absolute inset-0 w-full h-full"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient
                            id="trend"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                          >
                            <stop
                              offset="0%"
                              stopColor="#f97316"
                              stopOpacity="0.8"
                            />
                            <stop
                              offset="100%"
                              stopColor="#dc2626"
                              stopOpacity="0.8"
                            />
                          </linearGradient>
                        </defs>
                        <motion.path
                          d="M 20 180 Q 100 120 200 100 T 400 80 T 600 60"
                          stroke="url(#trend)"
                          strokeWidth="3"
                          fill="none"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 2, ease: "easeInOut" }}
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    </div>

                    {/* Performance Stats */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6">
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold text-green-400">
                          +24.7%
                        </div>
                        <div className="text-xs text-gray-400">Today</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold text-blue-400">
                          $12,847
                        </div>
                        <div className="text-xs text-gray-400">Portfolio</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold text-orange-400">
                          47
                        </div>
                        <div className="text-xs text-gray-400">Signals</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='5' cy='5' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <motion.div
            className="text-center mb-12 sm:mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center bg-orange-500/20 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8 border border-orange-500/30">
              <Sparkles className="w-5 h-5 text-orange-400 mr-3 animate-pulse" />
              <span className="text-xs sm:text-sm text-orange-300 font-medium">
                Powered by Advanced AI Technology
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8 text-white">
              An Unfair Advantage
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                in Your Pocket
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Our AI doesn't just follow trends—it anticipates them. We combine
              multiple layers of analysis to deliver signals with unparalleled
              precision.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 mb-12 sm:mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group cursor-pointer"
              >
                <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-700/50 hover:border-orange-500/50 transition-all duration-500 h-full relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://placehold.co/500x300/000000/FFFFFF?text=Image+Not+Found";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>

                    <div className="absolute top-4 sm:top-6 left-4 sm:left-6 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-orange-500/25">
                      {(() => {
                        const IconComponent = feature.icon;
                        return (
                          <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                        );
                      })()}
                    </div>
                  </div>

                  <div className="p-6 sm:p-8">
                    <h3 className="text-xl sm:text-2xl font-bold mb-4 text-white group-hover:text-orange-400 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 text-base mb-6 leading-relaxed">
                      {feature.description}
                    </p>

                    <div className="space-y-3">
                      {feature.details.map((detail, idx) => (
                        <div key={idx} className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                          <span className="text-gray-400 text-sm">
                            {detail}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Technology Showcase Section */}
      <div className="py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1.5s" }}
          ></div>
        </div>

        <div id="about" className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Content Side */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1"
            >
              <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-full mb-6 sm:mb-8 border border-orange-500/30">
                <Bot className="w-5 h-5 text-orange-400 mr-3" />
                <span className="text-orange-300 font-medium text-sm sm:text-base">
                  Powered by Advanced AI
                </span>
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8 text-white leading-tight">
                The Future of Trading
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                  is Here
                </span>
              </h2>

              <p className="text-lg sm:text-xl text-gray-400 mb-8 leading-relaxed">
                Our advanced AI doesn't just analyze the market—it understands
                it. Using machine learning algorithms trained on millions of
                data points, SignalAI identifies patterns that human traders
                miss, delivering precision that transforms every trade into an
                opportunity.
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      Neural Network Analysis
                    </h3>
                    <p className="text-gray-400">
                      Deep learning models process market sentiment, technical
                      indicators, and trading volumes simultaneously.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      Real-Time Adaptation
                    </h3>
                    <p className="text-gray-400">
                      Continuously learns from market changes to improve
                      accuracy and reduce false signals.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      Precision Targeting
                    </h3>
                    <p className="text-gray-400">
                      Advanced algorithms identify optimal entry and exit points
                      with surgical precision.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Robot Hand Image Side */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="order-1 lg:order-2 relative"
            >
              <div className="relative max-w-lg mx-auto">
                {/* Background glow effect */}

                {/* Robot hand image container */}
                <div className="relative">
                  {/* Robot hand image */}
                  <div className="relative">
                    <img
                      src="https://lebwork.b-cdn.net/Remove%20the%20white%20bac.png"
                      alt="AI Robot Hand with Bitcoin"
                      className="w-full h-auto"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://placehold.co/500x400/1a1a1a/f97316?text=AI+Robot+Hand";
                      }}
                    />
                  </div>

                  {/* Connecting lines animation */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id="connectionGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor="#f97316"
                          stopOpacity="0.6"
                        />
                        <stop
                          offset="100%"
                          stopColor="#3b82f6"
                          stopOpacity="0.6"
                        />
                      </linearGradient>
                    </defs>
                    <motion.path
                      d="M 100 100 Q 200 50 300 120 T 400 200"
                      stroke="url(#connectionGradient)"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="5,5"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }}
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div id="how-it-works" className="py-16 sm:py-24 relative">
        <div className="absolute top-20 left-20 w-20 h-20 bg-orange-500/10 rounded-full blur-xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <motion.div
            className="text-center mb-12 sm:mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
          >
            <div id="steps" className="inline-flex items-center bg-orange-500/20 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8 border border-orange-500/30">
              <Clock className="w-5 h-5 text-orange-500 mr-3" />
              <span className="text-orange-300 font-medium text-sm sm:text-base">
                Ready in under 5 minutes
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8 text-white">
              Start Trading in
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                3 Simple Steps
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
              Get started with your Pro trial and see the power of AI analysis for yourself.
            </p>
          </motion.div>

          <div className="relative">
            <motion.div
              className="grid md:grid-cols-3 gap-12 relative"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {howItWorksSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  variants={itemVariants}
                  className="text-center group"
                  whileHover={{ y: -8 }}
                >
                  <div className="relative">
                    <div className="relative h-64 mb-8 rounded-2xl overflow-hidden group-hover:shadow-xl transition-all duration-500">
                      <img
                        src={step.image}
                        alt={step.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://placehold.co/400x250/000000/FFFFFF?text=Image+Not+Found";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent"></div>

                      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-lg">
                        {index + 1}
                      </div>

                      <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 flex space-x-2">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i <= index ? "bg-orange-400" : "bg-gray-600"
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-gray-700/50 group-hover:border-orange-500/50 transition-all duration-500">
                      <h3 className="text-xl sm:text-2xl font-bold mb-4 text-white group-hover:text-orange-400 transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="text-gray-300 leading-relaxed mb-6">
                        {step.description}
                      </p>

                      <div className="flex items-center justify-center text-orange-400 font-medium">
                        <span className="text-sm mr-2">Learn more</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>

                    {index < howItWorksSteps.length - 1 && (
                      <div className="hidden md:block absolute top-32 -right-6 w-12 h-px bg-gradient-to-r from-orange-500/50 to-transparent"></div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-16 sm:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8 text-white">
              Flexible Pricing for Every Trader
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
              Choose the plan that's right for you and start your journey to
              smarter trading.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers[pricingPlan].map((tier, index) => (
              <motion.div
                key={tier.name}
                className={`bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 border ${
                  tier.popular ? "border-orange-500/80" : "border-gray-700/50"
                } relative overflow-hidden`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
                    POPULAR
                  </div>
                )}
                <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white">
                  {tier.name}
                </h3>
                <p className="text-gray-400 mb-6 text-sm">
                  For individual traders
                </p>
                <div className="mb-8">
                  <span className="text-4xl sm:text-5xl font-bold text-white">
                    ${tier.price}
                  </span>
                    {tier.originalPrice && (
                      <span className="text-lg text-gray-400 line-through ml-2">
                        ${tier.originalPrice}
                      </span>
                    )}
                  <span className="text-gray-400">
                    /{pricingPlan === "monthly" ? "mo" : "yr"}
                  </span>
                </div>
                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, fIndex) => (
                    <li
                      key={fIndex}
                      className="flex items-center text-gray-300"
                    >
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <motion.button
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                    tier.popular
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-gray-700/50 hover:bg-gray-600/50 text-gray-300"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={ () => window.location.href = '/pricing'}
                >
                  Explore {tier.name}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-500/10 via-transparent to-blue-500/10"></div>
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] sm:w-[1000px] sm:h-[1000px] border border-orange-500/10 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          ></motion.div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-500/30 to-red-500/30 backdrop-blur-sm rounded-full mb-6 sm:mb-8 border border-orange-500/50">
              <Sparkles className="w-5 h-5 text-orange-300 mr-3" />
              <span className="text-orange-200 font-medium text-sm sm:text-base">
                Get Full Access
              </span>
            </div>

            <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 sm:mb-8 text-white leading-tight">
              Ready to Supercharge
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-pink-500">
                Your Analysis?
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-gray-400 mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Join now and get 7 days of Pro access on us. Experience the full power of AI-driven analysis and unlock your trading potential.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-10 sm:mb-12">
              <motion.button
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 px-8 sm:px-12 py-4 sm:py-6 rounded-xl sm:rounded-2xl font-bold text-lg sm:text-xl text-white transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/25 hover:-translate-y-1 sm:hover:-translate-y-2 flex items-center w-full sm:w-auto justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Zap className="w-6 h-6 mr-3" />
                Claim Your 7-Day Pro Trial
                <ArrowRight className="w-6 h-6 ml-3" />
              </motion.button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                <span>7-day Pro trial</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
