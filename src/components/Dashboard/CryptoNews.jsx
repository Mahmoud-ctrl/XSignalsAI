import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, ExternalLink, RefreshCw, Newspaper, DollarSign } from 'lucide-react';

const CryptoNewsInsights = () => {
  const [marketData, setMarketData] = useState([]);
  const [globalData, setGlobalData] = useState(null);
  const [trendingCoins, setTrendingCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchCryptoData();
  }, []);

  const fetchCryptoData = async () => {
    try {
      setLoading(true);
      
      // Fetch top cryptocurrencies market data
      const marketResponse = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d'
      );
      
      // Fetch global market data
      const globalResponse = await fetch('https://api.coingecko.com/api/v3/global');
      
      // Fetch trending coins
      const trendingResponse = await fetch('https://api.coingecko.com/api/v3/search/trending');
      
      const [marketData, globalData, trendingData] = await Promise.all([
        marketResponse.json(),
        globalResponse.json(),
        trendingResponse.json()
      ]);
      
      setMarketData(marketData);
      setGlobalData(globalData.data);
      setTrendingCoins(trendingData.coins);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error fetching crypto data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (price >= 1) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    return `$${price.toFixed(8)}`;
  };

  const formatMarketCap = (marketCap) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const generateNewsInsights = (coin) => {
    const insights = [
      `${coin.name} shows ${coin.price_change_percentage_24h > 0 ? 'bullish' : 'bearish'} momentum with ${Math.abs(coin.price_change_percentage_24h).toFixed(2)}% change`,
      `Market cap of ${formatMarketCap(coin.market_cap)} places ${coin.name} at rank #${coin.market_cap_rank}`,
      `24h volume of ${formatMarketCap(coin.total_volume)} indicates ${coin.total_volume > coin.market_cap * 0.1 ? 'high' : 'moderate'} trading activity`
    ];
    return insights[Math.floor(Math.random() * insights.length)];
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 min-h-screen text-white">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin mr-2 text-orange-500" size={24} />
          <span className="text-lg">Loading crypto insights...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          {/* <Newspaper className="text-orange-500" size={32} /> */}
          <h1 className="text-3xl font-bold text-white">Crypto News & Insights</h1>
        </div>
        <button 
          onClick={fetchCryptoData}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Global Market Overview */}
      {globalData && (
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-xl border border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
            <DollarSign className="mr-2 text-green-400" />
            Global Market Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-slate-400 text-sm">Total Market Cap</p>
              <p className="text-2xl font-bold text-white">
                {formatMarketCap(globalData.total_market_cap.usd)}
              </p>
              <p className={`text-sm ${getChangeColor(globalData.market_cap_change_percentage_24h_usd)}`}>
                {globalData.market_cap_change_percentage_24h_usd > 0 ? '+' : ''}
                {globalData.market_cap_change_percentage_24h_usd.toFixed(2)}% (24h)
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Volume (24h)</p>
              <p className="text-2xl font-bold text-white">
                {formatMarketCap(globalData.total_volume.usd)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Bitcoin Dominance</p>
              <p className="text-2xl font-bold text-white">
                {globalData.market_cap_percentage.btc.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Market Data & News */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-white">Top Cryptocurrencies</h2>
          <div className="space-y-4">
            {marketData.map((coin) => (
              <div key={coin.id} className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-xl border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img src={coin.image} alt={coin.name} className="w-8 h-8" />
                    <div>
                      <h3 className="font-semibold text-lg text-white">{coin.name}</h3>
                      <p className="text-slate-400 text-sm uppercase">{coin.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">{formatPrice(coin.current_price)}</p>
                    <p className={`text-sm font-medium ${getChangeColor(coin.price_change_percentage_24h)}`}>
                      {coin.price_change_percentage_24h > 0 ? '+' : ''}
                      {coin.price_change_percentage_24h.toFixed(2)}%
                    </p>
                  </div>
                </div>

                {/* Market Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-slate-400">Market Cap</p>
                    <p className="font-semibold text-white">{formatMarketCap(coin.market_cap)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Volume (24h)</p>
                    <p className="font-semibold text-white">{formatMarketCap(coin.total_volume)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Rank</p>
                    <p className="font-semibold text-white">#{coin.market_cap_rank}</p>
                  </div>
                </div>

                {/* Generated Insight */}
                <div className="bg-slate-700 rounded-lg p-3 border-l-4 border-orange-500">
                  <p className="text-slate-200 text-sm">
                    <strong className="text-orange-400">Market Insight:</strong> {generateNewsInsights(coin)}
                  </p>
                </div>

                {/* Price Changes */}
                <div className="flex space-x-4 mt-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-400">1h:</span>
                    <span className={getChangeColor(coin.price_change_percentage_1h_in_currency)}>
                      {coin.price_change_percentage_1h_in_currency ? (
                        <>
                          {coin.price_change_percentage_1h_in_currency > 0 ? '+' : ''}
                          {coin.price_change_percentage_1h_in_currency.toFixed(2)}%
                        </>
                      ) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-400">7d:</span>
                    <span className={getChangeColor(coin.price_change_percentage_7d_in_currency)}>
                      {coin.price_change_percentage_7d_in_currency ? (
                        <>
                          {coin.price_change_percentage_7d_in_currency > 0 ? '+' : ''}
                          {coin.price_change_percentage_7d_in_currency.toFixed(2)}%
                        </>
                      ) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Coins Sidebar */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-white">Trending Coins</h2>
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-xl border border-slate-700 p-6">
            <div className="space-y-4">
              {trendingCoins.slice(0, 7).map((trendingCoin, index) => (
                <div key={trendingCoin.item.id} className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-orange-900/50 rounded-full flex items-center justify-center text-xs font-bold text-orange-400">
                    {index + 1}
                  </div>
                  <img src={trendingCoin.item.small} alt={trendingCoin.item.name} className="w-6 h-6" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-white">{trendingCoin.item.name}</p>
                    <p className="text-slate-400 text-xs uppercase">{trendingCoin.item.symbol}</p>
                  </div>
                  <div className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                    #{trendingCoin.item.market_cap_rank || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Market Status */}
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40  rounded-xl border border-slate-700 p-6 mt-6">
            <h3 className="font-semibold mb-4 text-white">Market Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Active Cryptocurrencies</span>
                <span className="font-medium text-white">{globalData?.active_cryptocurrencies.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Markets</span>
                <span className="font-medium text-white">{globalData?.markets.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Market Cap Change</span>
                <span className={`font-medium ${getChangeColor(globalData?.market_cap_change_percentage_24h_usd)}`}>
                  {globalData?.market_cap_change_percentage_24h_usd > 0 ? '+' : ''}
                  {globalData?.market_cap_change_percentage_24h_usd.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {lastUpdated && (
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center space-x-2 text-slate-400 text-sm">
                <Calendar size={14} />
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CryptoNewsInsights;