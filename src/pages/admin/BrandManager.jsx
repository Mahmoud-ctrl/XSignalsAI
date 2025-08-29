import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, Award, AlertCircle } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";

const API_URL = import.meta.env.VITE_REACT_APP_API;

const BrandManager = () => {
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [newBrand, setNewBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(''); 
  const [editMode, setEditMode] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBrands();
    fetchCategories(); 
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/brands`,{
        withCredentials: true,
      });
      
      setBrands(res.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch brands');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // NEW: fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/categories`,{
        withCredentials: true,
      });
      setCategories(res.data);
    } catch (err) {
      setError('Failed to fetch categories');
      console.error(err);
    }
  };

  const handleBrandAdd = async () => { 
    if (!newBrand.trim() || !selectedCategory) return; // Require both fields
    const csrfToken = Cookies.get('csrf_access_token');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/admin/brands`, {
        name: newBrand.trim(),
        category_id: selectedCategory, 
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken
        }
      }
    );
      setNewBrand("");
      setSelectedCategory("");
      fetchBrands();
      setError('');
      setSuccess('Brand added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add brand');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBrandDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/admin/brands/${id}`);
      fetchBrands();
      setError('');
      setSuccess('Brand deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete brand');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBrandUpdate = async (id) => {
    if (!editName.trim()) return;
    
    setLoading(true);
    try {
      const csrfToken = Cookies.get('csrf_access_token');
      await axios.put(`${API_URL}/admin/brands/${id}`, {
        name: editName.trim(),
      }, {headers : {'X-CSRF-TOKEN': csrfToken}, withCredentials: true});
      setEditMode(null);
      setEditName("");
      fetchBrands();
      setError('');
      setSuccess('Brand updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update brand');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const cancelEdit = () => {
    setEditMode(null);
    setEditName('');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Brand Manager</h1>
                <p className="text-sm text-gray-600">Manage your product brands</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Award className="w-4 h-4" />
              <span>{brands.length} Brands</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Add Brand Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Plus className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Add New Brand</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={newBrand}
              placeholder="Enter brand name..."
              onChange={(e) => setNewBrand(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleBrandAdd)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={loading}
            />
          </div>
          {/* NEW: Category dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={loading}
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleBrandAdd}
            disabled={loading || !newBrand.trim() || !selectedCategory}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Brand</span>
          </button>
        </div>
      </div>

        {/* Brands List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-3">
              <Award className="w-5 h-5 text-gray-600" />
              <span>Brands</span>
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {loading && brands.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading brands...</p>
              </div>
            ) : brands.length === 0 ? (
              <div className="p-8 text-center">
                <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No brands found</p>
                <p className="text-gray-500 text-sm mt-1">Add your first brand to get started</p>
              </div>
            ) : (
              brands.map((brand) => (
                <div key={brand.id} className="p-4 hover:bg-gray-50 transition-colors">
                  {editMode === brand.id ? (
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyPress={(e) => handleKeyPress(e, () => handleBrandUpdate(brand.id))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleBrandUpdate(brand.id)}
                          disabled={loading || !editName.trim()}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Save changes"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={loading}
                          className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Cancel edit"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {brand.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-gray-900 font-medium">{brand.name}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditMode(brand.id);
                            setEditName(brand.name);
                          }}
                          disabled={loading}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Edit brand"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleBrandDelete(brand.id)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete brand"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandManager;