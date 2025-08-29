import React, { useState, useEffect } from 'react';
import { Copy, Check, Users, Gift, Clock, TrendingUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_REACT_APP_API;

export default function ReferralPage() {
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalEarned: 0,
    activeTrial: '7 days'
  });

  // Fetch referral code on component mount
  useEffect(() => {
    fetchReferralCode();
  }, []);

  const fetchReferralCode = async () => {
    const accessToken = localStorage.getItem('access_token');
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`${API_URL}/referral-code`, {
        method: 'GET',
        credentials: 'include',  
      });
      
      if (response.ok) {
        const data = await response.json();
        setReferralCode(data.referral_code);
        setReferralStats({
            totalReferrals: data.referral_stats.referrals_count,
            totalEarned: data.referral_stats.extra_days,
            activeTrial: `${data.referral_stats.remaining_days} days`
        });
      }
    } catch (error) {
      console.error('Error fetching referral code:', error);
      // Fallback for demo
      setReferralCode('DEMO123ABC');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getReferralLink = () => {
    return `${window.location.origin}/signup?ref=${referralCode}`;
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Refer Friends & Earn Extra Trial Time
          </h1>
          <p className="text-gray-400">
            Share AI Signals with your friends and get rewarded with extended
            trial access
          </p>
        </div>

        {/* Main Referral Card */}
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 border border-gray-700/50 backdrop-blur-sm rounded-xl shadow-lg p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Your Referral Link
              </h2>
              <div className="flex items-center bg-gray-700 rounded-lg p-4 mb-4">
                <input
                  type="text"
                  value={loading ? "Loading..." : getReferralLink()}
                  readOnly
                  className="flex-1 bg-transparent text-gray-300 outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="ml-3 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  disabled={loading}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-gray-400">
                Share this link with friends to start earning rewards
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center">
                <Users size={48} className="text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 border border-gray-700/50 backdrop-blur-sm rounded-xl shadow-lg p-6 text-center">
            <div className="bg-green-900/30 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="text-green-400" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-white">
              {referralStats.totalReferrals}
            </h3>
            <p className="text-gray-400">Total Referrals</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg p-6 text-center">
            <div className="bg-orange-900/30 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Clock className="text-orange-400" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-white">
              {referralStats.totalEarned}
            </h3>
            <p className="text-gray-400">Extra Days Earned</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg p-6 text-center">
            <div className="bg-blue-900/30 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="text-blue-400" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-white">
              {referralStats.activeTrial}
            </h3>
            <p className="text-gray-400">Current Trial</p>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 border border-gray-700/50 backdrop-blur-sm rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            How Referrals Work
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Share Your Link</h3>
              <p className="text-gray-400 text-sm">
                Send your referral link to friends who might be interested in AI
                trading signals
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-semibold text-white mb-2">Friend Signs Up</h3>
              <p className="text-gray-400 text-sm">
                Your friend creates an account using your referral link and
                starts their trial
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">3</span>
              </div>
              <h3 className="font-semibold text-white mb-2">
                You Get Rewarded
              </h3>
              <p className="text-gray-400 text-sm">
                Earn extra trial time added to your account automatically
              </p>
            </div>
          </div>
        </div>

        {/* Reward Structure */}
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 border border-gray-700/50 backdrop-blur-sm rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            Reward Structure
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Gift className="text-orange-400" size={20} />
                <span className="font-medium text-white">Per Referral</span>
              </div>
              <span className="text-orange-400 font-semibold">+1 Day</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Gift className="text-green-400" size={20} />
                <span className="font-medium text-white">
                  3 Referrals Milestone
                </span>
              </div>
              <span className="text-green-400 font-semibold">
                +2 Bonus Days
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Gift className="text-blue-400" size={20} />
                <span className="font-medium text-white">
                  5 Referrals Milestone
                </span>
              </div>
              <span className="text-blue-400 font-semibold">+3 Bonus Days</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Gift className="text-purple-400" size={20} />
                <span className="font-medium text-white">
                  10 Referrals Milestone
                </span>
              </div>
              <span className="text-purple-400 font-semibold">
                +5 Bonus Days
              </span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-orange-900/20 rounded-lg border border-orange-500/20">
            <p className="text-orange-300 text-sm text-center">
              <strong>Maximum:</strong> Up to 14 extra days can be earned
              through referrals
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}