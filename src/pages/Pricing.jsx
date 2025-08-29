import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Target, ChevronRight, Shield, CheckCircle, XCircle, ArrowRight, 
  Sparkles, Clock, Zap, TrendingUp, Users, Award, Star, Bot,
  CreditCard, Lock, Globe, Headphones, X, Bitcoin, Banknote
} from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [error, setError] = useState("")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pendingPlan, setPendingPlan] = useState(null)
  const [availableCurrencies, setAvailableCurrencies] = useState([])
  const [selectedCurrency, setSelectedCurrency] = useState("btc")

  const pricingPlans = [
    {
      name: "Free",
      price: "0",
      originalPrice: null,
      planId: "free",
      features: [
        "1 Max Pair",
        "5 Scans/Hour",
        "1 Take Profit Level (TP1)",
        "Pre-selected AI Models",
        "Limited Timeframes (5m, 1h)",
        "Hidden AI Response",
        "Basic Signals Only",
      ],
      isPopular: false,
      gradient: "from-gray-600 to-gray-700",
      buttonText: "Current Plan",
      disabled: false,
    },
    {
      name: "Premium",
      price: "19.99",
      originalPrice: "39.99",
      planId: "premium",
      features: [
        "5 Max Pairs",
        "20 Scans/Hour",
        "2 Take Profit Levels (TP1 + TP2)",
        "2 AI Model Options",
        "All Timeframes Available",
        "Hidden AI Response",
        "Advanced Signals + Risk Analysis",
        "BTC Influence Analysis",
      ],
      isPopular: true,
      gradient: "from-orange-500 to-red-500",
      buttonText: "Upgrade to Premium",
      disabled: false,
    },
    {
      name: "Pro",
      price: "29.99",
      originalPrice: "59.99",
      planId: "pro",
      features: [
        "20 Max Pairs",
        "100 Scans/Hour",
        "3 Take Profit Levels (TP1 + TP2 + TP3)",
        "5+ AI Model Options",
        "All Timeframes Available",
        "Full AI Response Visible",
        "Premium Signals + All Features",
        "BTC Influence Analysis",
        "Custom Signal Parameters",
      ],
      isPopular: false,
      gradient: "from-purple-500 to-blue-500",
      buttonText: "Go Pro",
      disabled: false,
    },
  ]

  // Fetch available currencies on component mount
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await fetch(`${API_URL}/payments/available-currencies`)
        const data = await response.json()
        if (response.ok) {
          setAvailableCurrencies(data.currencies || [])
        }
      } catch (err) {
        console.error('Failed to fetch currencies:', err)
      }
    }
    fetchCurrencies()
  }, [])

  const handlePlanSelect = (planId) => {
    if (planId === "free") return
    
    setPendingPlan(planId)
    setShowPaymentModal(true)
    setError("")
  }

  const handleCryptoCheckout = async () => {
    if (!pendingPlan) return
    
    setIsLoading(true)
    setError("")
    setSelectedPlan(pendingPlan)

    try {
      const token = localStorage.getItem('access_token')
      
      if (!token) {
        setError("Please log in to upgrade your plan")
        return
      }

      const response = await fetch(`${API_URL}/payments/checkout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": Cookies.get("csrf_access_token"),
        },
        body: JSON.stringify({
          plan: pendingPlan,
          pay_currency: selectedCurrency,
        }),
      });

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout')
      }

      // Redirect to NOWPayments checkout
      if (data.payment_url) {
        window.location.href = data.payment_url
      } else {
        throw new Error('No payment URL received')
      }

    } catch (err) {
      console.error('Checkout error:', err)
      setError(err.message || 'Failed to start checkout process')
    } finally {
      setIsLoading(false)
      setSelectedPlan(null)
    }
  }

  const closeModal = () => {
    setShowPaymentModal(false)
    setPendingPlan(null)
    setError("")
    setIsLoading(false)
    setSelectedPlan(null)
  }

  const getCurrencyDisplay = (currency) => {
    const currencyMap = {
      'usdttrc20': 'USDT (TRC-20)',
      'usdterc20': 'USDT (ERC-20)', 
      'btc': 'Bitcoin (BTC)',
      'eth': 'Ethereum (ETH)',
      'usdc': 'USD Coin (USDC)',
      'bnb': 'Binance Coin (BNB)',
      'ltc': 'Litecoin (LTC)',
      'trx': 'TRON (TRX)',
      'doge': 'Dogecoin (DOGE)'
    };
    
    return currencyMap[currency.toLowerCase()] || currency.toUpperCase();
  };

  const benefits = [
    {
      icon: TrendingUp,
      title: "94.8% Accuracy Rate",
      description: "Our AI has consistently delivered high-precision signals across all market conditions"
    },
    {
      icon: Clock,
      title: "24/7 Monitoring",
      description: "Never miss an opportunity with round-the-clock market analysis and instant alerts"
    },
    {
      icon: Shield,
      title: "Risk Management",
      description: "Every signal includes calculated stop-loss and take-profit levels for capital protection"
    },
    {
      icon: Bot,
      title: "Advanced AI Models",
      description: "Multiple proprietary AI models working together for maximum market insight"
    }
  ]

  const faqs = [
    {
      question: "How does the AI signal generation work?",
      answer: "Our AI analyzes thousands of data points including market sentiment, technical indicators, volume patterns, and historical data to identify high-probability trading opportunities."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time. You'll continue to have access to your plan features until the end of your billing period."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We currently accept all major cryptocurrencies including Bitcoin, Ethereum, USDT, and many others. Credit card payments are coming soon!"
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Choose Payment Method</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4 mb-6">
                {/* Crypto Payment Option */}
                <div className="border border-orange-500/30 bg-orange-500/10 rounded-xl p-4">
                  <div className="flex items-center mb-4">
                    <Bitcoin className="w-8 h-8 text-orange-400 mr-3" />
                    <div>
                      <h4 className="font-semibold text-lg">Cryptocurrency</h4>
                      <p className="text-sm text-gray-300">
                        Pay with Bitcoin, Ethereum, USDT and more
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Currency
                    </label>
                    <select
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {availableCurrencies.length > 0 ? (
                        availableCurrencies.map((currency) => (
                          <option key={currency} value={currency}>
                            {getCurrencyDisplay(currency)}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="#">Loading...</option>
                        </>
                      )}
                    </select>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCryptoCheckout}
                    disabled={isLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        Pay with Crypto
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Credit Card Option (Disabled) */}
                <div className="border border-gray-600 bg-gray-700/50 rounded-xl p-4 opacity-60">
                  <div className="flex items-center mb-4">
                    <CreditCard className="w-8 h-8 text-gray-400 mr-3" />
                    <div>
                      <h4 className="font-semibold text-lg text-gray-300">
                        Credit/Debit Card
                      </h4>
                      <p className="text-sm text-gray-400">
                        Visa, Mastercard, American Express
                      </p>
                    </div>
                  </div>

                  <button
                    disabled
                    className="w-full bg-gray-600 text-gray-400 py-3 rounded-lg font-semibold cursor-not-allowed flex items-center justify-center"
                  >
                    Coming Soon
                    <Clock className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>

              <div className="text-center text-sm text-gray-400">
                <p>🔒 All payments are secured and encrypted</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative pt-20 pb-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center bg-gray-800/50 rounded-full px-4 py-2 mb-8 border border-gray-700">
              <Sparkles className="w-4 h-4 text-orange-400 mr-2" />
              <span className="text-sm text-gray-300">
                Choose Your Trading Edge
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Pricing Plans Built for
              <span className="text-orange-400 block">Every Trader</span>
            </h1>

            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              From beginners to professional traders, we have a plan that scales
              with your trading journey. Start free and upgrade as you grow.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid lg:grid-cols-3 gap-8 items-stretch">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative flex flex-col bg-gray-800/60 rounded-2xl p-8 shadow-lg transition-all duration-300 group hover:shadow-2xl ${
                plan.isPopular
                  ? "ring-2 ring-orange-500 scale-105"
                  : "hover:scale-105"
              }`}
              whileHover={{ y: -8 }}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-orange-500 text-white text-sm font-semibold px-6 py-2 rounded-full shadow-lg">
                    MOST POPULAR
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-4 text-gray-200">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center">
                  {plan.price === "0" ? (
                    <span className="text-4xl font-bold text-gray-100">
                      Free
                    </span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-gray-100">
                        ${plan.price}
                      </span>
                      <span className="text-gray-200 ml-1">/mo</span>
                      {plan.originalPrice && (
                        <span className="text-lg text-gray-400 line-through ml-2">
                          ${plan.originalPrice}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {plan.originalPrice && (
                  <div className="text-sm text-green-600 mt-1">
                    Save ${parseInt(plan.originalPrice) - parseInt(plan.price)}
                    /month
                  </div>
                )}
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-200">{feature}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePlanSelect(plan.planId)}
                disabled={plan.disabled}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center ${
                  plan.isPopular
                    ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg disabled:opacity-50"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-900 disabled:opacity-50"
                }`}
              >
                {plan.buttonText}
                {plan.planId !== "free" && (
                  <ArrowRight className="w-5 h-5 ml-2" />
                )}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 mb-6">All plans include 24/7 support</p>
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
            <div className="flex items-center">
              <Bitcoin className="w-4 h-4 mr-2" />
              Crypto Payments Only
            </div>
            <div className="flex items-center">
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Anytime
            </div>
            <div className="flex items-center">
              <Headphones className="w-4 h-4 mr-2" />
              24/7 Support
            </div>
          </div>
        </motion.div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Why Choose SignalAI?</h2>
            <p className="text-gray-400 text-lg">
              The advantages that set us apart from the competition
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 rounded-xl bg-gray-800/40"
              >
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-400">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-400 text-lg">
              Everything you need to know about our plans
            </p>
          </motion.div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/60 rounded-xl p-6"
              >
                <h3 className="text-xl font-semibold mb-3 text-orange-400">
                  {faq.question}
                </h3>
                <p className="text-gray-300">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}