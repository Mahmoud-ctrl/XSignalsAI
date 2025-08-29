import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Target, Clock, Calendar, Filter, RefreshCw, Activity, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const MotionDiv = ({ children, className = "" }) => (
    <motion.div
      className={className}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
        {children}
    </motion.div>
);


const ReportsPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // State for different report data
  const [overviewData, setOverviewData] = useState(null);
  const [timeframeData, setTimeframeData] = useState([]);
  const [symbolData, setSymbolData] = useState([]);
  const [confidenceData, setConfidenceData] = useState(null);
  const [dailyActivityData, setDailyActivityData] = useState([]);

  // Helper function to make API requests with authentication
  const makeApiRequest = async (endpoint, params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_URL}/reports/${endpoint}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',  
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      return data.data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  };

  const fetchOverviewData = async () => {
    try {
      const params = {
        days: selectedPeriod,
        ...(selectedSymbol && { symbol: selectedSymbol })
      };
      
      const data = await makeApiRequest('performance-overview', params);
      setOverviewData(data);
    } catch (error) {
      console.error('Error fetching overview data:', error);
      setError('Failed to fetch performance overview');
    }
  };

  const fetchTimeframeData = async () => {
    try {
      const params = {
        days: selectedPeriod,
        ...(selectedSymbol && { symbol: selectedSymbol })
      };
      
      const data = await makeApiRequest('timeframe-analysis', params);
      setTimeframeData(data);
    } catch (error) {
      console.error('Error fetching timeframe data:', error);
      setError('Failed to fetch timeframe analysis');
    }
  };

  const fetchSymbolData = async () => {
    try {
      const params = {
        days: selectedPeriod,
        min_signals: 5 // Only include symbols with at least 5 signals
      };
      
      const data = await makeApiRequest('symbol-performance', params);
      setSymbolData(data);
    } catch (error) {
      console.error('Error fetching symbol data:', error);
      setError('Failed to fetch symbol performance');
    }
  };

  const fetchConfidenceData = async () => {
    try {
      const params = {
        days: selectedPeriod,
        ...(selectedSymbol && { symbol: selectedSymbol })
      };
      
      const data = await makeApiRequest('confidence-analysis', params);
      setConfidenceData(data);
    } catch (error) {
      console.error('Error fetching confidence data:', error);
      setError('Failed to fetch confidence analysis');
    }
  };

  const fetchDailyActivityData = async () => {
    try {
      const params = {
        days: selectedPeriod,
        ...(selectedSymbol && { symbol: selectedSymbol })
      };
      
      const data = await makeApiRequest('daily-activity', params);
      setDailyActivityData(data.daily_activity || []);
    } catch (error) {
      console.error('Error fetching daily activity data:', error);
      setError('Failed to fetch daily activity');
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchOverviewData(),
        fetchTimeframeData(),
        fetchSymbolData(),
        fetchConfidenceData(),
        fetchDailyActivityData()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Individual errors are already set by each function
    }
    
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };
  const COLORS = ['#FF6B35', '#00D4AA', '#6366F1', '#F59E0B', '#EF4444'];

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = "text-white" }) => (
    <motion.div variants={itemVariants} className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-lg p-6 border border-gray-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        <div className="p-2 bg-gray-700 rounded-lg">
          <Icon className="h-5 w-5 text-gray-300" />
        </div>
      </div>
      {trend && (
        <div className={`flex items-center mt-3 ${trend.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend.value >= 0 ? (
            <TrendingUp className="h-4 w-4 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 mr-1" />
          )}
          <span className="text-sm font-medium">
            {Math.abs(trend.value)}% {trend.label}
          </span>
        </div>
      )}
    </motion.div>
  );

  const TabButton = ({ id, label, icon: Icon, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        active
          ? 'text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {active && (
        <motion.div
          layoutId="active-tab-indicator"
          className="absolute inset-0 bg-orange-500 rounded-lg"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      <Icon className="h-4 w-4 relative" />
      <span className="relative">{label}</span>
    </button>
  );

  // Error display component
  const ErrorMessage = ({ message, onRetry }) => (
    <MotionDiv>
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                <div className="text-red-400">⚠️</div>
                <span className="text-red-300">{message}</span>
                </div>
                {onRetry && (
                <button
                    onClick={onRetry}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                >
                    Retry
                </button>
                )}
            </div>
        </div>
    </MotionDiv>
  );

  // Loading component
  if (loading && !overviewData) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center">
            <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
            <span className="ml-3 text-gray-300">Loading reports...</span>
          </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <motion.div 
        className="border-b border-gray-700"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Reports</h1>
              <p className="text-gray-400 mt-1">Advanced analytics and performance insights</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Period Selector */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="60">Last 60 Days</option>
                <option value="90">Last 90 Days</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <motion.div 
            className="flex space-x-2 mt-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <TabButton
              id="overview"
              label="Overview"
              icon={BarChart3}
              active={activeTab === 'overview'}
              onClick={setActiveTab}
            />
            <TabButton
              id="timeframe"
              label="Timeframe Analysis"
              icon={Clock}
              active={activeTab === 'timeframe'}
              onClick={setActiveTab}
            />
            <TabButton
              id="symbols"
              label="Symbol Performance"
              icon={Target}
              active={activeTab === 'symbols'}
              onClick={setActiveTab}
            />
            <TabButton
              id="confidence"
              label="Confidence Analysis"
              icon={TrendingUp}
              active={activeTab === 'confidence'}
              onClick={setActiveTab}
            />
            <TabButton
              id="activity"
              label="Daily Activity"
              icon={Activity}
              active={activeTab === 'activity'}
              onClick={setActiveTab}
            />
          </motion.div>
        </div>
      </motion.div>

      <div className="p-6">
        {/* Error Message */}
        {error && (
          <ErrorMessage 
            message={error} 
            onRetry={() => {
              setError(null);
              handleRefresh();
            }} 
          />
        )}

        <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                {/* Overview Tab */}
                {activeTab === 'overview' && overviewData && (
                <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
                    {/* Key Metrics */}
                    <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={containerVariants}>
                    <MetricCard
                        title="Total Signals"
                        value={overviewData.total_signals}
                        subtitle={`${overviewData.signal_frequency_per_day || 0}  per day avg`}
                        icon={BarChart3}
                    />
                    <MetricCard
                        title="Win Rate"
                        value={`${overviewData.win_rate || 0}%`}
                        subtitle={`${overviewData.profitable_signals || 0} profitable`}
                        icon={Target}
                        color="text-green-400"
                        trend={{
                        value: overviewData.performance_trend?.trend_change || 0,
                        label: 'vs previous period'
                        }}
                    />
                    <MetricCard
                        title="Average Confidence"
                        value={`${overviewData.average_confidence || 0}%`}
                        subtitle="AI confidence level"
                        icon={TrendingUp}
                        color="text-blue-400"
                    />
                    <MetricCard
                        title="Active Signals"
                        value={overviewData.active_signals || 0}
                        subtitle={`${overviewData.completed_signals || 0} completed`}
                        icon={Activity}
                        color="text-orange-400"
                    />
                    </motion.div>

                    {/* Charts */}
                    <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" variants={containerVariants}>
                    {/* Take Profit Distribution */}
                    {overviewData.take_profit_distribution && (
                        <MotionDiv className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold mb-4">Take Profit Level Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                            <Pie
                                data={[
                                { name: 'TP1', value: overviewData.take_profit_distribution[1] || 0 },
                                { name: 'TP2', value: overviewData.take_profit_distribution[2] || 0 },
                                { name: 'TP3', value: overviewData.take_profit_distribution[3] || 0 }
                                ].filter(item => item.value > 0)}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {[0, 1, 2].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        </MotionDiv>
                    )}

                    {/* Performance Trend */}
                    {overviewData.performance_trend && (
                        <MotionDiv className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-lg p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold mb-4">Performance Trend</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                            <span className="text-gray-400">Recent Win Rate (7 days)</span>
                            <span className="text-green-400 font-semibold">
                                {overviewData.performance_trend.recent_win_rate}%
                            </span>
                            </div>
                            <div className="flex justify-between items-center">
                            <span className="text-gray-400">Previous Period</span>
                            <span className="text-gray-300 font-semibold">
                                {overviewData.performance_trend.previous_win_rate}%
                            </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                            <span className="text-gray-400">Change</span>
                            <span className={`font-semibold ${overviewData.performance_trend.trend_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {overviewData.performance_trend.trend_change > 0 ? '+' : ''}{overviewData.performance_trend.trend_change}%
                            </span>
                            </div>
                        </div>
                        </MotionDiv>
                    )}
                    </motion.div>

                    {/* No Data Message */}
                    {overviewData.message && (
                    <MotionDiv className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-lg p-6 border border-gray-700 text-center">
                        <p className="text-gray-400">{overviewData.message}</p>
                    </MotionDiv>
                    )}
                </motion.div>
                )}

                {/* Timeframe Analysis Tab */}
                {activeTab === 'timeframe' && (
                <div className="space-y-6">
                    {timeframeData.length > 0 ? (
                    <>
                        <MotionDiv className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold mb-4">Performance by Timeframe</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={timeframeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="timeframe" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip
                                contentStyle={{
                                backgroundColor: '#1F2937',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#F3F4F6'
                                }}
                            />
                            <Bar dataKey="win_rate" fill="#00D4AA" name="Win Rate %" />
                            <Bar dataKey="average_confidence" fill="#6366F1" name="Avg Confidence %" />
                            </BarChart>
                        </ResponsiveContainer>
                        </MotionDiv>

                        {/* Timeframe Details Table */}
                        <MotionDiv className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-lg p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold mb-4">Detailed Breakdown</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-gray-700">
                                <th className="pb-3 text-gray-400">Timeframe</th>
                                <th className="pb-3 text-gray-400">Total Signals</th>
                                <th className="pb-3 text-gray-400">Win Rate</th>
                                <th className="pb-3 text-gray-400">Avg Confidence</th>
                                <th className="pb-3 text-gray-400">Profitable</th>
                                </tr>
                            </thead>
                            <tbody>
                                {timeframeData.map((item, index) => (
                                <tr key={index} className="border-b border-gray-700/50">
                                    <td className="py-3 text-white font-medium">{item.timeframe}</td>
                                    <td className="py-3 text-gray-300">{item.total_signals}</td>
                                    <td className="py-3">
                                    <span className={`font-medium ${item.win_rate >= 70 ? 'text-green-400' : item.win_rate >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {item.win_rate}%
                                    </span>
                                    </td>
                                    <td className="py-3 text-gray-300">{item.average_confidence}%</td>
                                    <td className="py-3 text-green-400">{item.profitable_signals}</td>
                                </tr>
                                ))}
                            </tbody>
                            </table>
                        </div>
                        </MotionDiv>
                    </>
                    ) : (
                    <MotionDiv className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-lg p-6 border border-gray-700 text-center">
                        <p className="text-gray-400">No timeframe data available for the selected period.</p>
                    </MotionDiv>
                    )}
                </div>
                )}

                {/* Symbol Performance Tab */}
                {activeTab === 'symbols' && (
                <div className="space-y-6">
                    {symbolData.length > 0 ? (
                    <>
                        <MotionDiv className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-lg p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold mb-4">Top Performing Symbols</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={symbolData.slice(0, 10)} layout="horizontal">
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis type="number" stroke="#9CA3AF" />
                            <YAxis dataKey="symbol" type="category" stroke="#9CA3AF" width={80} />
                            <Tooltip
                                contentStyle={{
                                backgroundColor: '#1F2937',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#F3F4F6'
                                }}
                            />
                            <Bar dataKey="win_rate" fill="#00D4AA" name="Win Rate %" />
                            </BarChart>
                        </ResponsiveContainer>
                        </MotionDiv>

                        {/* Symbol Details */}
                        <motion.div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4" variants={containerVariants} initial="hidden" animate="visible">
                        {symbolData.slice(0, 12).map((symbol, index) => (
                            <motion.div key={index} variants={itemVariants} className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-lg p-4 border border-gray-700">
                            <h4 className="font-semibold text-lg text-white mb-2">{symbol.symbol}</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                <span className="text-gray-400">Total Signals:</span>
                                <span className="text-white">{symbol.total_signals}</span>
                                </div>
                                <div className="flex justify-between">
                                <span className="text-gray-400">Win Rate:</span>
                                <span className="text-green-400 font-medium">{symbol.win_rate}%</span>
                                </div>
                                <div className="flex justify-between">
                                <span className="text-gray-400">Avg Confidence:</span>
                                <span className="text-blue-400">{symbol.average_confidence}%</span>
                                </div>
                                <div className="flex justify-between">
                                <span className="text-gray-400">Profitable:</span>
                                <span className="text-green-400">{symbol.profitable_signals}</span>
                                </div>
                                {symbol.timeframes_used && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Timeframes:</span>
                                    <span className="text-gray-300 text-xs">{symbol.timeframes_used.join(', ')}</span>
                                </div>
                                )}
                            </div>
                            </motion.div>
                        ))}
                        </motion.div>
                    </>
                    ) : (
                    <MotionDiv className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-lg p-6 border border-gray-700 text-center">
                        <p className="text-gray-400">No symbol data available for the selected period.</p>
                    </MotionDiv>
                    )}
                </div>
                )}

                {/* Confidence Analysis Tab */}
                {activeTab === 'confidence' && confidenceData && (
                <div className="space-y-6">
                    {confidenceData.confidence_ranges && confidenceData.confidence_ranges.length > 0 ? (
                    <>
                        <MotionDiv className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-lg p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold mb-4">Win Rate by Confidence Level</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={confidenceData.confidence_ranges}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="confidence_range" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip
                                contentStyle={{
                                backgroundColor: '#1F2937',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#F3F4F6'
                                }}
                            />
                            <Bar dataKey="win_rate" fill="#FF6B35" name="Win Rate %" />
                            </BarChart>
                        </ResponsiveContainer>
                        </MotionDiv>

                        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" variants={containerVariants} initial="hidden" animate="visible">
                        {/* Confidence Correlation */}
                        {confidenceData.correlation_analysis && (
                            <MotionDiv className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-lg p-6 border border-gray-700">
                            <h3 className="text-lg font-semibold mb-4">Confidence Correlation</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                <span className="text-gray-400">Avg Profitable Confidence:</span>
                                <span className="text-green-400 font-semibold">
                                    {confidenceData.correlation_analysis.average_profitable_confidence}%
                                </span>
                                </div>
                                <div className="flex justify-between items-center">
                                <span className="text-gray-400">Avg Losing Confidence:</span>
                                <span className="text-red-400 font-semibold">
                                    {confidenceData.correlation_analysis.average_losing_confidence}%
                                </span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                                <span className="text-gray-400">Difference:</span>
                                <span className="text-blue-400 font-semibold">
                                    +{confidenceData.correlation_analysis.confidence_difference}%
                                </span>
                                </div>
                            </div>
                            </MotionDiv>
                        )}

                        {/* Confidence Distribution */}
                        <MotionDiv className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-lg p-6 border border-gray-700">
                            <h3 className="text-lg font-semibold mb-4">Signal Distribution</h3>
                            <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                data={confidenceData.confidence_ranges}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ confidence_range, total_signals }) => `${confidence_range.split(' ')[0]}: ${total_signals}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="total_signals"
                                >
                                {confidenceData.confidence_ranges.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                            </ResponsiveContainer>
                        </MotionDiv>
                        </motion.div>
                    </>
                    ) : (
                    <MotionDiv className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-lg p-6 border border-gray-700 text-center">
                        <p className="text-gray-400">
                        {confidenceData.message || 'No confidence data available for the selected period.'}
                        </p>
                    </MotionDiv>
                    )}
                </div>
                )}

                {/* Daily Activity Tab */}
                {activeTab === 'activity' && (
                <div className="space-y-6">
                    {dailyActivityData.length > 0 ? (
                    <>
                        <MotionDiv className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-lg p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold mb-4">Daily Signal Activity</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <AreaChart data={dailyActivityData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                                dataKey="date"
                                stroke="#9CA3AF"
                                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip
                                contentStyle={{
                                backgroundColor: '#1F2937',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#F3F4F6'
                                }}
                                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                            />
                            <Area
                                type="monotone"
                                dataKey="total_signals"
                                stackId="1"
                                stroke="#FF6B35"
                                fill="#FF6B35"
                                fillOpacity={0.6}
                                name="Total Signals"
                            />
                            <Area
                                type="monotone"
                                dataKey="profitable_signals"
                                stackId="2"
                                stroke="#00D4AA"
                                fill="#00D4AA"
                                fillOpacity={0.6}
                                name="Profitable Signals"
                            />
                            </AreaChart>
                        </ResponsiveContainer>
                        </MotionDiv>

                        {/* Activity Metrics */}
                        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={containerVariants} initial="hidden" animate="visible">
                            <MotionDiv className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-lg p-6 border border-gray-700">
                                <h4 className="text-lg font-semibold mb-3">Total Activity</h4>
                                <p className="text-3xl font-bold text-orange-400">
                                {dailyActivityData.reduce((sum, day) => sum + day.total_signals, 0)}
                                </p>
                                <p className="text-gray-400 mt-1">signals generated</p>
                            </MotionDiv>

                            <MotionDiv className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-lg p-6 border border-gray-700">
                                <h4 className="text-lg font-semibold mb-3">Daily Average</h4>
                                <p className="text-3xl font-bold text-blue-400">
                                {(dailyActivityData.reduce((sum, day) => sum + day.total_signals, 0) / dailyActivityData.length).toFixed(1)}
                                </p>
                                <p className="text-gray-400 mt-1">signals per day</p>
                            </MotionDiv>

                            <MotionDiv className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-lg p-6 border border-gray-700">
                                <h4 className="text-lg font-semibold mb-3">Most Active Day</h4>
                                <p className="text-3xl font-bold text-green-400">
                                {Math.max(...dailyActivityData.map(day => day.total_signals))}
                                </p>
                                <p className="text-gray-400 mt-1">signals in one day</p>
                            </MotionDiv>
                        </motion.div>
                    </>
                    ) : (
                    <MotionDiv className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-lg p-6 border border-gray-700 text-center">
                        <p className="text-gray-400">No daily activity data available for the selected period.</p>
                    </MotionDiv>
                    )}
                </div>
                )}
            </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReportsPage;
