import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, BarChart3, Users, Settings, FileText, Calendar, Menu, X, TrendingUp, User, Gift,
  Target, Clock, Zap, Shield, Bell, Search, ChevronDown, Activity, DollarSign, LogOut, Globe,
  CreditCard,
  ShoppingCart
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardPage from '../components/Dashboard/Dashboard';
import { Link } from 'react-router-dom';
import ComprehensiveAnalysis from '../components/Dashboard/Analysis';
import AISignalsDashboard from '../components/Dashboard/AnalysisHistory';
import NotificationDropdown from '../components/Notification';
import ReferralPage from '../components/Dashboard/ReferralPage';
import ReportsPage from '../components/Dashboard/Reports';
import CryptoNewsInsights from '../components/Dashboard/CryptoNews';
import BillingDashboard from '../components/Dashboard/BillingDashboard';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropDownRef = useRef(null);
  
  // Analysis state
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisSymbol, setAnalysisSymbol] = useState('');
  const [analysisTimeframe, setAnalysisTimeframe] = useState('1h');
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname.split('/')[1]; // e.g., "dashboard"
  const initialTab = currentPath || 'dashboard';

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const pathTab = location.pathname.split('/')[1] || 'dashboard';
    setActiveTab(pathTab);
  }, [location.pathname]);
  

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "analytics", label: "AI Analysis", icon: BarChart3 },
    { id: "signals", label: "Signals History", icon: Target },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "live-news", label: "Live News", icon: Globe },
    { id: "billing", label: "Billing", icon: CreditCard },
    // { id: "settings", label: "Settings", icon: Settings },
  ];

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  // Handle analysis navigation
  const handleAnalyzeSymbol = (symbol, timeframe = '1h') => {
    setAnalysisSymbol(symbol);
    setAnalysisTimeframe(timeframe);
    setShowAnalysis(true);
    setActiveTab('analytics');
    navigate('/analytics');
  };

  const handleBackToDashboard = () => {
    console.log('Going back to dashboard');
    setShowAnalysis(false);
    setAnalysisSymbol('');
    setActiveTab('dashboard');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropDownRef.current && !dropDownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, []);

  const handleSignOut = () => {
    // Remove token from localStorage
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('access_token')
    }
    
    // Redirect to login page or home
    window.location.href = '/login'
  }

  const PlaceholderContent = ({ title }) => (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
      <div className="bg-gray-800/40 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 text-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-400 text-lg">Coming Soon</p>
          <p className="text-gray-500 text-sm mt-2">This {title.toLowerCase()} section is under development.</p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    // If showing analysis, render analysis component
    if (showAnalysis && analysisSymbol) {
      return (
        <ComprehensiveAnalysis 
          symbol={analysisSymbol}
          timeframe={analysisTimeframe}
          onBack={handleBackToDashboard}
        />
      );
    }

    // Otherwise render based on active tab
    switch(activeTab) {
      case 'dashboard':
        return (
          <DashboardPage 
            onAnalyzeSymbol={handleAnalyzeSymbol}
          />
        );
      case 'analytics':
        return  <ComprehensiveAnalysis 
            symbol={analysisSymbol}
            timeframe={analysisTimeframe}
            onBack={handleBackToDashboard}
          />;
      case 'signals':
        return <AISignalsDashboard />;
      case 'referrals':
        return <ReferralPage />;
      case 'reports':
        return <ReportsPage />;
      case 'live-news':
        return <CryptoNewsInsights />;
      case 'billing':
        return <BillingDashboard />;
      default:
        return <PlaceholderContent title="Page Not Found" />;
    }
  };

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const capitalized = user.tier.charAt(0).toUpperCase() + user.tier.slice(1);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-800/95 backdrop-blur-xl shadow-xl transition-transform duration-300 ease-in-out flex flex-col border-r border-gray-700/50`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div className="flex items-center space-x-2">
            <Link to="/">
              <img
                src="https://lebwork.b-cdn.net/XSignalsAI-logo.png"
                alt=""
                height={140}
                width={140}
              />
            </Link>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id ||
                (showAnalysis && item.id === "analytics");
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      if (item.id === "dashboard") {
                        setShowAnalysis(false);
                        setAnalysisSymbol("");
                      }
                      setActiveTab(item.id);
                      navigate(`/${item.id}`); // Update the URL
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                        : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                    }`}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    <span className="ml-3 font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700/50">
          <div className="flex items-center p-3 rounded-lg bg-gray-700/30">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user.name
                  .split(" ")
                  .map((part) => part[0].toUpperCase())
                  .join("")}
              </span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {capitalized} Trader
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Bar - INCREASED Z-INDEX */}
        <header className="bg-gray-800/50 backdrop-blur-xl shadow-lg border-b border-gray-700/50 p-4 relative z-[60]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-lg font-semibold text-white capitalize">
                {showAnalysis ? `${analysisSymbol} Analysis` : activeTab}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center bg-gray-800/50 rounded-full px-3 sm:px-4 py-2 border border-gray-700 hover:border-orange-500/50 transition-all duration-300 transform hover:scale-105"
              >
                <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 mr-1.5 sm:mr-2 animate-pulse flex-shrink-0" />
                <button
                  className="text-xs sm:text-sm font-bold text-gray-300 whitespace-nowrap overflow-hidden text-ellipsis"
                  onClick={() => (window.location.href = "/referrals")}
                >
                  <span className="hidden sm:inline">Refer & Earn Up to 30 Free Days!</span>
                  <span className="sm:hidden">Refer & Earn 30 Days!</span>
                </button>
              </motion.div>
              <NotificationDropdown />
              <div className="relative" ref={dropDownRef}>
                <button
                  className="hidden sm:flex items-center space-x-2 bg-gray-700/50 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu - INCREASED Z-INDEX */}
                {isOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-[70]">
                    <div className="py-1">
                      {/* User Info */}
                      <div className="px-4 py-2 border-b border-gray-700">
                        <p className="text-sm font-medium text-white">{`${user.name}`}</p>
                        <p className="text-xs text-gray-400">{`${capitalized} Trader`}</p>
                      </div>

                      {/* Pricing Link */}
                      <button
                        onClick={() => (window.location.href = "/pricing")}
                        className="w-full flex items-center px-4 py-2 text-sm text-orange-400 hover:bg-gray-700 transition-colors"
                      >
                        <CreditCard size={16} className="mr-3" />
                        <span className="text-white">Plans & Pricing</span>
                      </button>

                      {/* Sign Out */}
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                      >
                        <LogOut size={16} className="mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area - LOWER Z-INDEX */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 relative z-10">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;