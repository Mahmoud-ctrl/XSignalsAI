import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Activity, TrendingUp, TrendingDown, AlertTriangle, Target, Clock, DollarSign, BarChart3, Filter, RefreshCw, Calendar, XCircle, CheckCircle } from "lucide-react";
import formatEntryStatus from "../../utils/formatEntry";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Animation variants for motion components
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

const formatResults = (status) => {
    return status
      .toLowerCase()
      .split('_')
      .map(word => word.toUpperCase())
      .join(' ');
}

const AISignalsDashboard = () => {
  const [signals, setSignals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    symbol: '',
    primary_signal: '',
    entry_status: '',
    result: '',
    timeframe: ''
  });

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSignalBadgeColor = (signal) => {
    switch (signal) {
      case 'BUY':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'SELL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'WAIT':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'PENDING':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'WAIT_FOR_PULLBACK':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const fetchSignals = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });
      
      const response = await fetch(`${API_URL}/ai-signals?${queryParams}`,{
        credentials: 'include',  
      });
      const data = await response.json();
      
      if (data.success) {
        setSignals(data.data);
      }
    } catch (error) {
      console.error('Error fetching signals:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/ai-signals/stats`, {
        credentials: 'include',  
      });
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchSignals(), fetchStats()]);
    setRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSignals(), fetchStats()]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  useEffect(() => {
    fetchSignals();
  }, [filters]);

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center"
        >
          <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
          <span className="ml-3 text-gray-300">Loading data...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-4 sm:p-6">
      {/* Header */}
      <motion.div 
        className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            AI Trading Signals
          </h1>
          <p className="text-gray-400 text-lg">
            Advanced AI-powered trading signals and analytics
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm rounded-xl p-6 border border-gray-600/30 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Signals</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {stats.total_signals}
                </p>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-lg">
                <Activity className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm  rounded-xl p-6 border border-gray-600/30 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active Trades</p>
                <p className="text-3xl font-bold text-blue-400 mt-1">
                  {stats.performance_metrics.active_trades}
                </p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm  rounded-xl p-6 border border-gray-600/30 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Win Rate</p>
                <p className="text-3xl font-bold text-green-400 mt-1">
                  {stats.performance_metrics.win_rate_percentage}%
                </p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-lg">
                <Target className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm rounded-xl p-6 border border-gray-600/30 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Avg Confidence</p>
                <p className="text-3xl font-bold text-purple-400 mt-1">
                  {stats.performance_metrics.average_confidence?.toFixed(1) ||
                    "N/A"}
                </p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-lg">
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Distribution Charts */}
      {stats && (
        <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
          {/* Signal Distribution */}
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm rounded-xl p-6 border border-gray-600/30 shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-4">
              Signal Distribution
            </h3>
            <div className="space-y-4">
              {Object.entries(stats.signal_distribution).map(
                ([signal, count]) => (
                  <div
                    key={signal}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          signal === "BUY"
                            ? "bg-green-500"
                            : signal === "SELL"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                        }`}
                      ></div>
                      <span className="text-gray-300 font-medium">{signal}</span>
                    </div>
                    <span className="text-white font-bold text-lg">{count}</span>
                  </div>
                )
              )}
            </div>
          </motion.div>

          {/* Entry Status Distribution */}
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm  rounded-xl p-6 border border-gray-600/30 shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-4">
              Entry Status
            </h3>
            <div className="space-y-4">
              {Object.entries(stats.entry_status_distribution).map(
                ([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-300 font-medium text-sm">
                        {formatEntryStatus(status)}
                      </span>
                    </div>
                    <span className="text-white font-bold text-lg">{count}</span>
                  </div>
                )
              )}
            </div>
          </motion.div>

          {/* Result Distribution */}
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm  rounded-xl p-6 border border-gray-600/30 shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-4">
              Result Distribution
            </h3>
            <div className="space-y-4">
              {Object.entries(stats.result_distribution).map(
                ([result, count]) => (
                  <div
                    key={result}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          result === "ACTIVE"
                            ? "bg-blue-500"
                            : result === "COMPLETED"
                            ? "bg-green-500"
                            : "bg-orange-500"
                        }`}
                      ></div>
                      <span className="text-gray-300 font-medium">{formatResults(result)}</span>
                    </div>
                    <span className="text-white font-bold text-lg">{count}</span>
                  </div>
                )
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div 
        className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm  rounded-xl p-6 mb-8 border border-gray-600/30 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-orange-500/10 p-2 rounded-lg">
            <Filter className="w-5 h-5 text-orange-500" />
          </div>
          <h3 className="text-xl font-semibold text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <select
            value={filters.symbol}
            onChange={(e) => setFilters({ ...filters, symbol: e.target.value })}
            className="bg-gray-700 text-gray-300 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">All Symbols</option>
            <option value="BTCUSDT">BTCUSDT</option>
            <option value="ETHUSDT">ETHUSDT</option>
            <option value="BNBUSDT">BNBUSDT</option>
          </select>

          <select
            value={filters.primary_signal}
            onChange={(e) =>
              setFilters({ ...filters, primary_signal: e.target.value })
            }
            className="bg-gray-700 text-gray-300 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">All Signals</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
            <option value="WAIT">WAIT</option>
          </select>

          <select
            value={filters.entry_status}
            onChange={(e) =>
              setFilters({ ...filters, entry_status: e.target.value })
            }
            className="bg-gray-700 text-gray-300 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">All Entry Status</option>
            <option value="WAIT_FOR_PULLBACK">Wait for Pullback</option>
            <option value="IMMEDIATE">Immediate</option>
          </select>

          <select
            value={filters.result}
            onChange={(e) => setFilters({ ...filters, result: e.target.value })}
            className="bg-gray-700 text-gray-300 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">All Results</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={filters.timeframe}
            onChange={(e) =>
              setFilters({ ...filters, timeframe: e.target.value })
            }
            className="bg-gray-700 text-gray-300 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">All Timeframes</option>
            <option value="15-minute">15 Minutes</option>
            <option value="1-hour">1 Hour</option>
            <option value="4-hour">4 Hours</option>
            <option value="1-day">1 Day</option>
          </select>
        </div>
      </motion.div>

      {/* Signals Cards */}
      <motion.div 
        className="rounded-xl shadow-lg bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm border border-gray-600/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-semibold text-white">Trading Signals</h2>
          <p className="text-gray-400 mt-1">
            {signals.length} signals found
          </p>
        </div>

        <div className="p-6">
          <AnimatePresence>
            {signals.length === 0 ? (
              <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No signals found matching the current filters.</p>
              </motion.div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {signals.map((signal) => (
                  <motion.div
                    key={signal.id}
                    variants={itemVariants}
                    layout
                    className="bg-gray-750 rounded-lg p-6 border border-gray-600 hover:border-gray-500 transition-all duration-200 hover:shadow-lg"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-bold text-white">
                          {signal.symbol}
                        </h3>
                        <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded">
                          {signal.timeframe}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold border ${getSignalBadgeColor(
                          signal.primary_signal
                        )}`}
                      >
                        {signal.primary_signal}
                      </span>
                    </div>

                    {/* Status and Confidence */}
                    <div className="flex items-center justify-between mb-6">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeColor(
                          signal.entry_status
                        )}`}
                      >
                        {formatEntryStatus(signal.entry_status)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-semibold">
                          {signal.confidence}/100
                        </span>
                        <div className="w-20 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${signal.confidence}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Trading Details */}
                    <div className="space-y-4 mb-6">
                      {/* Entry Zone */}
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-2 font-medium">
                          Entry Zone
                        </div>
                        {signal.entry_zone ? (
                          <div className="flex items-center justify-between">
                            <div className="text-green-400 font-semibold">
                              Low: ${formatNumber(signal.entry_zone.low)}
                            </div>
                            <div className="text-blue-400 font-semibold">
                              High: ${formatNumber(signal.entry_zone.high)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-400">N/A</div>
                        )}
                      </div>

                      {/* Stop Loss and Take Profits */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                          <div className="text-sm text-red-300 mb-1 font-medium">
                            Stop Loss
                          </div>
                          <div className="text-red-400 font-bold text-lg">
                            ${formatNumber(signal.stop_loss)}
                          </div>
                        </div>

                        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                          <div className="text-sm text-green-300 mb-2 font-medium">
                            Take Profits
                          </div>
                          <div className="space-y-1">
                            {signal.take_profits?.map((tp, index) => (
                              <div
                                key={index}
                                className="text-green-400 text-sm font-medium"
                              >
                                TP{index + 1}: ${formatNumber(tp)}
                              </div>
                            )) || (
                              <div className="text-gray-400 text-sm">N/A</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Result Status */}
                      {signal.result && (
                        <div className="bg-gray-700/50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-400 font-medium">
                              Result
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBadgeColor(
                                signal.result
                              )}`}
                            >
                              {formatResults(signal.result)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timestamps */}
                    <div className="border-t border-gray-600 pt-4">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2 text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>Created</span>
                          </div>
                          <div className="text-gray-300 font-medium">
                            {formatDate(signal.created_at)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2 text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>Updated</span>
                          </div>
                          <div className="text-gray-300 font-medium">
                            {formatDate(signal.updated_at)}
                          </div>
                        </div>

                        {signal.closed_at && (
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2 text-gray-400">
                              {signal.result === 'SL_HIT' ? (
                                <XCircle className="w-4 h-4 text-red-400" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              )}
                              <span>Closed</span>
                            </div>
                            <div className="text-gray-300 font-medium">
                              {formatDate(signal.closed_at)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default AISignalsDashboard;
