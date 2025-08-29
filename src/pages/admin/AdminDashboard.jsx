import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Tag, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  XCircle,
  Sparkles,
  Percent,
  BarChart3,
  Activity
} from 'lucide-react';

const API_URL = import.meta.env.VITE_REACT_APP_API;

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/admin/dashboard`, {
            method: 'GET',
            credentials: 'include'
        });
        const data = await response.json();
        
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setDashboardData(data);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-xl h-32 shadow-sm"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl h-64 shadow-sm"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center space-x-2 text-red-700">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const { counts, product_stats, top_brands, top_categories, recent_products } = dashboardData;

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-1 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const ProductStatCard = ({ title, value, icon: Icon, color, percentage }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {percentage && (
            <p className="text-xs text-gray-500 mt-1">{percentage}% of total</p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );

  const TopListCard = ({ title, items, icon: Icon }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Icon className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">{index + 1}</span>
              </div>
              <span className="font-medium text-gray-900">{item.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{item.product_count} products</span>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const totalProducts = counts.products;
  const stockPercentage = Math.round((product_stats.in_stock / totalProducts) * 100);
  const newPercentage = Math.round((product_stats.new / totalProducts) * 100);
  const salePercentage = Math.round((product_stats.on_sale / totalProducts) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your store today.</p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Categories" 
            value={counts.categories} 
            icon={Tag} 
            color="bg-blue-500"
            trend="+12% from last month"
          />
          <StatCard 
            title="Total Brands" 
            value={counts.brands} 
            icon={Package} 
            color="bg-green-500"
            trend="+8% from last month"
          />
          <StatCard 
            title="Total Products" 
            value={counts.products} 
            icon={ShoppingCart} 
            color="bg-purple-500"
            trend="+15% from last month"
          />
          <StatCard 
            title="Admins" 
            value={counts.admins} 
            icon={Users} 
            color="bg-orange-500"
          />
        </div>

        {/* Product Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Product Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <ProductStatCard 
              title="In Stock" 
              value={product_stats.in_stock} 
              icon={CheckCircle} 
              color="bg-green-500"
              percentage={stockPercentage}
            />
            <ProductStatCard 
              title="Out of Stock" 
              value={product_stats.out_of_stock} 
              icon={XCircle} 
              color="bg-red-500"
              percentage={100 - stockPercentage}
            />
            <ProductStatCard 
              title="New Products" 
              value={product_stats.new} 
              icon={Sparkles} 
              color="bg-yellow-500"
              percentage={newPercentage}
            />
            <ProductStatCard 
              title="On Sale" 
              value={product_stats.on_sale} 
              icon={Percent} 
              color="bg-pink-500"
              percentage={salePercentage}
            />
            <ProductStatCard 
              title="Total Sales" 
              value={product_stats.total_sales} 
              icon={TrendingUp} 
              color="bg-indigo-500"
            />
          </div>
        </div>

        {/* Charts and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <TopListCard 
            title="Top Brands" 
            items={top_brands} 
            icon={BarChart3}
          />
          <TopListCard 
            title="Top Categories" 
            items={top_categories} 
            icon={Tag}
          />
          
          {/* Recent Products */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Products</h3>
            </div>
            <div className="space-y-3">
              {recent_products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{product.title}</p>
                    <p className="text-sm text-gray-500">Added {formatDate(product.created_at)}</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;