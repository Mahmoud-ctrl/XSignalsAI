import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { 
  CreditCard, Calendar, TrendingUp, DollarSign, Clock, AlertTriangle, CheckCircle, 
  XCircle, RefreshCw, Filter, User, BarChart3, Target, Activity, ExternalLink
} from "lucide-react";

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

const BillingDashboard = () => {
  const [planData, setPlanData] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    per_page: 10
  });

  // Get JWT token from localStorage or context
  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json'
    };
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTierBadgeColor = (tier) => {
    switch (tier) {
      case 'free':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'premium':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pro':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'expired':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'crypto':
        return '₿';
      case 'card':
        return '💳';
      default:
        return '💰';
    }
  };

  const fetchPlanData = async () => {
    try {
      const response = await fetch(`${API_URL}/billing/plan`, {
        credentials: 'include',  
      });
      const data = await response.json();
      
      if (data.success) {
        setPlanData(data.data);
      }
    } catch (error) {
      console.error('Error fetching plan data:', error);
    }
  };

  const fetchBillingHistory = async (page = 1) => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        per_page: filters.per_page.toString(),
        ...(filters.status && { status: filters.status })
      });
      
      const response = await fetch(`${API_URL}/billing/history?${queryParams}`, {
        credentials: 'include',  
      });
      const data = await response.json();
      
      if (data.success) {
        setBillingHistory(data.data.transactions);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching billing history:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_URL}/billing/summary`, {
        credentials: 'include',  
      });
      const data = await response.json();
      
      if (data.success) {
        setSummary(data.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const response = await fetch(`${API_URL}/billing/pending-payments`, {
        credentials: 'include',  
      });
      const data = await response.json();
      
      if (data.success) {
        setPendingPayments(data.data.pending_payments);
      }
    } catch (error) {
      console.error('Error fetching pending payments:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/billing/stats`, {
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
    await Promise.all([
      fetchPlanData(),
      fetchBillingHistory(currentPage),
      fetchSummary(),
      fetchPendingPayments(),
      fetchStats()
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await refreshData();
      setLoading(false);
    };
    
    loadData();
  }, []);

  useEffect(() => {
    fetchBillingHistory(currentPage);
  }, [filters, currentPage]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 min-h-screen text-white">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin mr-2 text-orange-500" size={24} />
          <span className="text-lg">Loading billing data...</span>
        </div>
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
            Billing Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Manage your subscription and billing information
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

      {/* Current Plan Card */}
      {planData && (
        <motion.div 
          className="mb-8 bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm rounded-xl p-6 border border-gray-600/30 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-500/10 p-3 rounded-lg">
                <User className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Current Plan</h3>
                <p className="text-gray-400">Your subscription details</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getTierBadgeColor(planData.effective_tier)}`}>
              {planData.effective_tier.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Plan Status</div>
              <div className="text-white font-semibold">
                {planData.is_plan_expired ? (
                  <span className="text-red-400">Expired</span>
                ) : planData.is_on_trial ? (
                  <span className="text-yellow-400">Trial Active</span>
                ) : (
                  <span className="text-green-400">Active</span>
                )}
              </div>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Expires At</div>
              <div className="text-white font-semibold">
                {planData.plan_expires_at 
                  ? formatDate(planData.plan_expires_at)
                  : planData.trial_expires_at 
                    ? formatDate(planData.trial_expires_at)
                    : 'No expiry'
                }
              </div>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Days Remaining</div>
              <div className="text-white font-semibold">
                {planData.days_until_expiry !== null 
                  ? `${planData.days_until_expiry} days`
                  : 'N/A'
                }
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary Stats */}
      {summary && (
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
                <p className="text-gray-400 text-sm font-medium">Total Spent</p>
                <p className="text-3xl font-bold text-green-400 mt-1">
                  ${formatNumber(summary.total_spent_usd)}
                </p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-lg">
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm rounded-xl p-6 border border-gray-600/30 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Confirmed</p>
                <p className="text-3xl font-bold text-blue-400 mt-1">
                  {summary.transaction_counts.confirmed || 0}
                </p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm rounded-xl p-6 border border-gray-600/30 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-orange-400 mt-1">
                  {summary.transaction_counts.pending || 0}
                </p>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-lg">
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm rounded-xl p-6 border border-gray-600/30 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Recent (30d)</p>
                <p className="text-3xl font-bold text-purple-400 mt-1">
                  {summary.recent_transactions_count}
                </p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-lg">
                <Activity className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Pending Payments Alert */}
      {pendingPayments && pendingPayments.length > 0 && (
        <motion.div 
          className="mb-8 bg-gradient-to-br from-orange-800/20 to-orange-900/20 backdrop-blur-sm rounded-xl p-6 border border-orange-600/30 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
            <h3 className="text-xl font-semibold text-orange-400">Pending Payments</h3>
            <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full text-sm">
              {pendingPayments.length}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingPayments.map((payment) => (
              <div key={payment.id} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">{payment.plan}</span>
                  <span className="text-orange-400">${formatNumber(payment.amount_usd)}</span>
                </div>
                <div className="text-sm text-gray-400 mb-2">
                  {payment.pay_currency?.toUpperCase()}: {formatNumber(payment.pay_amount)}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${payment.is_expired ? 'text-red-400' : 'text-yellow-400'}`}>
                    {payment.is_expired ? 'Expired' : `${Math.floor(payment.time_remaining / 3600)}h remaining`}
                  </span>
                  {payment.payment_url && (
                    <a
                      href={payment.payment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div 
        className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm rounded-xl p-6 mb-8 border border-gray-600/30 shadow-lg"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="bg-gray-700 text-gray-300 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={filters.per_page}
            onChange={(e) => setFilters({ ...filters, per_page: parseInt(e.target.value) })}
            className="bg-gray-700 text-gray-300 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </motion.div>

      {/* Billing History */}
      <motion.div 
        className="rounded-xl shadow-lg bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm border border-gray-600/30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-semibold text-white">Transaction History</h2>
          <p className="text-gray-400 mt-1">
            {pagination ? `${pagination.total} transactions found` : 'Loading...'}
          </p>
        </div>

        <div className="p-6">
          <AnimatePresence>
            {billingHistory.length === 0 ? (
              <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CreditCard className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No transactions found.</p>
              </motion.div>
            ) : (
              <motion.div 
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {billingHistory.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    variants={itemVariants}
                    layout
                    className="bg-gray-750 rounded-lg p-6 border border-gray-600 hover:border-gray-500 transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gray-600 rounded-full p-3">
                          <span className="text-xl">
                            {getPaymentMethodIcon(transaction.payment_method)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {transaction.plan}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            Order #{transaction.order_id || transaction.id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          ${formatNumber(transaction.amount_usd)}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(
                            transaction.status
                          )}`}
                        >
                          {transaction.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {transaction.pay_currency && (
                      <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Crypto Amount: </span>
                            <span className="text-white font-medium">
                              {formatNumber(transaction.pay_amount)} {transaction.pay_currency?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Payment Method: </span>
                            <span className="text-white font-medium">
                              {transaction.payment_method}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">Created:</span>
                        <span className="text-gray-300">{formatDate(transaction.created_at)}</span>
                      </div>
                      {transaction.confirmed_at && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-gray-400">Confirmed:</span>
                          <span className="text-gray-300">{formatDate(transaction.confirmed_at)}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-gray-400 text-sm">
                Showing {((pagination.page - 1) * pagination.per_page) + 1} to{' '}
                {Math.min(pagination.page * pagination.per_page, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!pagination.has_prev}
                  className="px-3 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium">
                  {pagination.page}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                  disabled={!pagination.has_next}
                  className="px-3 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BillingDashboard;