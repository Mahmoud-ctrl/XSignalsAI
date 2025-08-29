import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom'
import { TrendingUp, BarChart3, Zap, Shield, Target, ChevronRight, ChevronDown, Play, Users, Award, Clock, Menu, X, User, Brain, Activity, Sparkles, Layers, Eye, Signal } from 'lucide-react';

const Navbar = ({ bgColor, className = '', visible = true, authenticated, authLoading }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu when clicking outside or on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsDropdownOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isMenuOpen]);

  const handleDropdownHover = (isHovering) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (isHovering) {
      setIsDropdownOpen(true);
    } else {
      timeoutRef.current = setTimeout(() => {
        setIsDropdownOpen(false);
      }, 300);
    }
  };

  const whyXSignalsData = [
    {
      icon: Brain,
      title: "Multi-Factor AI Analysis",
      description: "Process thousands of data points in real-time with neural network precision",
      features: ["Real-time sentiment analysis", "Technical pattern recognition", "Volume flow analysis"],
      gradient: "from-purple-500 to-blue-500"
    },
    {
      icon: BarChart3,
      title: "100+ Technical Indicators",
      description: "Comprehensive market analysis using advanced indicators and algorithms",
      features: ["RSI, MACD, Bollinger Bands", "Custom AI indicators", "Multi-timeframe analysis"],
      gradient: "from-green-500 to-teal-500"
    },
    {
      icon: Activity,
      title: "Dynamic Strategy Adaptation",
      description: "AI continuously learns and adapts to changing market conditions",
      features: ["Machine learning optimization", "Market regime detection", "Strategy backtesting"],
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: Shield,
      title: "AI Risk Management",
      description: "Maximize risk-to-reward ratio with intelligent position sizing",
      features: ["Dynamic stop-loss levels", "Portfolio correlation analysis", "Drawdown protection"],
      gradient: "from-blue-500 to-cyan-500"
    }
  ];

  const navLinks = [
    { name: "Features", href: "/#features" },
    { name: "Pricing", href: "/pricing" },
    { name: "About", href: "#about" },
    { name: "Steps", href: "#steps" },
  ];

  // Determine if navbar should have glossy background
  const hasBackground = bgColor !== 'bg-transparent';

  // Render authentication buttons based on auth state
  const renderAuthButtons = () => {
    if (authLoading) {
      return (
        <div className="hidden lg:flex items-center space-x-4">
          <div className="w-16 h-8 bg-gray-600 animate-pulse rounded"></div>
          <div className="w-24 h-8 bg-gray-600 animate-pulse rounded-lg"></div>
        </div>
      );
    }

    if (authenticated) {
      return (
        <div className="hidden lg:flex items-center space-x-4">
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 25px rgba(251, 146, 60, 0.3)",
            }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-6 py-2 rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-orange-500/25 flex items-center space-x-2"
            onClick={() => (window.location.href = "/dashboard")}
          >
            <User size={16} />
            <span>Dashboard</span>
          </motion.button>
        </div>
      );
    }

    return (
      <div className="hidden lg:flex items-center space-x-4">
        <motion.button
          className="text-gray-300 hover:text-white transition-colors relative group"
          onClick={() => (window.location.href = "/login")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Sign In
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
        </motion.button>
        <motion.button
          whileHover={{
            scale: 1.05,
            boxShadow: "0 10px 25px rgba(251, 146, 60, 0.3)",
          }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-6 py-2 rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-orange-500/25"
          onClick={() => (window.location.href = "/signup")}
        >
          Get Started
        </motion.button>
      </div>
    );
  };

  // Render mobile authentication buttons
  const renderMobileAuthButtons = () => {
    if (authLoading) {
      return (
        <div className="p-6 space-y-4 border-t border-white/10">
          <div className="w-full h-12 bg-gray-600 animate-pulse rounded-lg"></div>
          <div className="w-full h-12 bg-gray-600 animate-pulse rounded-lg"></div>
        </div>
      );
    }

    if (authenticated) {
      return (
        <div className="p-6 space-y-4 border-t border-white/10">
          <motion.button
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-orange-500/25 flex items-center justify-center space-x-2"
            onClick={() => {
              window.location.href = "/dashboard";
              setIsMenuOpen(false);
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 10px 25px rgba(251, 146, 60, 0.3)",
            }}
            whileTap={{ scale: 0.98 }}
          >
            <User size={16} />
            <span>Dashboard</span>
          </motion.button>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-4 border-t border-white/10">
        <motion.button
          className="w-full text-left text-gray-300 hover:text-white transition-colors py-3 px-4 hover:bg-white/5 rounded-lg"
          onClick={() => {
            window.location.href = "/login";
            setIsMenuOpen(false);
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Sign In
        </motion.button>
        <motion.button
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-orange-500/25"
          onClick={() => {
            window.location.href = "/signup";
            setIsMenuOpen(false);
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{
            scale: 1.02,
            boxShadow: "0 10px 25px rgba(251, 146, 60, 0.3)",
          }}
          whileTap={{ scale: 0.98 }}
        >
          Get Started
        </motion.button>
      </div>
    );
  };

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 text-white z-50 ${className}`}>
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`relative z-10 mx-auto max-w-7xl transition-all duration-500 ${
            hasBackground
              ? "mt-4 mx-4 sm:mx-6 lg:mx-auto rounded-2xl bg-[#080809] backdrop-blur-sm border border-white/10 shadow-lg"
              : "border border-transparent"
          }`}
          style={{
            background: hasBackground
              ? "#080809"
              : "transparent",
          }}
        >
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-2">
              <Link to="/">
                <motion.img
                  src="https://lebwork.b-cdn.net/XSignalsAI-logo.png"
                  alt="XSignals AI"
                  height={140}
                  width={140}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {/* Why XSignals AI Dropdown */}
              <div 
                className="relative"
                ref={dropdownRef}
                onMouseEnter={() => handleDropdownHover(true)}
                onMouseLeave={() => handleDropdownHover(false)}
              >
                <motion.button
                  className="hover:text-orange-400 transition-all duration-300 relative group flex items-center"
                  whileHover={{ y: -2 }}
                >
                  Why XSignals AI
                  <motion.div
                    animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </motion.div>
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-400 transition-all duration-300 group-hover:w-full"></span>
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute top-full left-0 mt-2 w-[800px] bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden"
                      style={{ transform: "translateX(-50%)", left: "50%" }}
                    >
                      <div className="p-8">
                        <div className="mb-6">
                          <div className="flex items-center mb-3">
                            <Sparkles className="w-6 h-6 text-orange-400 mr-3" />
                            <h3 className="text-xl font-bold text-white">Why Choose XSignals AI?</h3>
                          </div>
                          <p className="text-gray-400 text-sm">
                            Advanced AI technology that gives you an unfair advantage in crypto trading
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          {whyXSignalsData.map((item, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="group cursor-pointer"
                            >
                              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30 hover:border-orange-500/50 transition-all duration-300 group-hover:scale-105">
                                <div className="flex items-start">
                                  <div className={`w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mr-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                    <item.icon className="w-6 h-6 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-white font-bold mb-2 group-hover:text-orange-400 transition-colors duration-300">
                                      {item.title}
                                    </h4>
                                    <p className="text-gray-400 text-sm mb-3 leading-relaxed">
                                      {item.description}
                                    </p>
                                    {/* <ul className="space-y-1">
                                      {item.features.map((feature, fIndex) => (
                                        <li key={fIndex} className="flex items-center text-gray-500 text-xs">
                                          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-2 flex-shrink-0"></div>
                                          {feature}
                                        </li>
                                      ))}
                                    </ul> */}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="mt-6 pt-6 border-t border-gray-700/50 text-center"
                        >
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-orange-500/25 flex items-center mx-auto"
                            onClick={() => (window.location.href = "/signup")}
                          >
                            <Signal className="w-5 h-5 mr-2" />
                            Start Your 7-Day Pro Trial
                            <ChevronRight className="w-5 h-5 ml-2" />
                          </motion.button>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Other Navigation Links */}
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  className="hover:text-orange-400 transition-all duration-300 relative group"
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-400 transition-all duration-300 group-hover:w-full"></span>
                </motion.a>
              ))}
            </div>

            {/* Desktop Authentication Buttons */}
            {renderAuthButtons()}

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <motion.button
                onClick={toggleMenu}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Menu size={24} />
              </motion.button>
            </div>
          </div>
        </motion.nav>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-80 bg-gradient-to-b from-[#080809] via-[#1a1a1b] to-[#080809] backdrop-blur-xl border-l border-white/10 shadow-2xl z-[70] lg:hidden overflow-y-auto"
          >
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <Link to="/" onClick={() => setIsMenuOpen(false)}>
                  <img
                    src="https://lebwork.b-cdn.net/XSignalsAI-logo.png"
                    alt="XSignals AI"
                    height={100}
                    width={100}
                  />
                </Link>
                <motion.button
                  onClick={toggleMenu}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={24} className="text-white" />
                </motion.button>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 px-6 py-8 space-y-6">
                {/* Why XSignals AI Collapsible Section */}
                <div>
                  <motion.button
                    className="w-full text-left text-lg text-white hover:text-orange-400 transition-colors py-3 border-b border-white/5 flex items-center justify-between"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <span>Why XSignals AI</span>
                    <motion.div
                      animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 pt-4 space-y-4">
                          {whyXSignalsData.map((item, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30"
                            >
                              <div className="flex items-start">
                                <div className={`w-10 h-10 bg-gradient-to-br ${item.gradient} rounded-lg flex items-center justify-center mr-3 flex-shrink-0`}>
                                  <item.icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="text-white font-semibold mb-1 text-sm">
                                    {item.title}
                                  </h4>
                                  <p className="text-gray-400 text-xs mb-2">
                                    {item.description}
                                  </p>
                                  <div className="space-y-1">
                                    {item.features.slice(0, 2).map((feature, fIndex) => (
                                      <div key={fIndex} className="flex items-center text-gray-500 text-xs">
                                        <div className="w-1 h-1 bg-orange-400 rounded-full mr-2 flex-shrink-0"></div>
                                        {feature}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Other Navigation Links */}
                {navLinks.map((link, index) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    className="block text-lg text-white hover:text-orange-400 transition-colors py-3 border-b border-white/5"
                    onClick={() => setIsMenuOpen(false)}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (index + 1) * 0.1 }}
                    whileHover={{ x: 10 }}
                  >
                    <div className="flex items-center justify-between">
                      {link.name}
                      <ChevronRight size={16} />
                    </div>
                  </motion.a>
                ))}
              </div>

              {/* Mobile Authentication Buttons */}
              {renderMobileAuthButtons()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;