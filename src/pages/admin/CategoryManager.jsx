import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, Tag, Shield } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
const API_URL = import.meta.env.VITE_REACT_APP_API;
const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [editMode, setEditMode] = useState(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/categories`, {
        withCredentials: true,
      });
      setCategories(res.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch categories");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryAdd = async () => {
    if (!newCategory.trim()) return;
    
    setLoading(true);
    try {
      const csrfToken = Cookies.get('csrf_access_token');
      const res = await axios.post(`${API_URL}/admin/categories`, {
        name: newCategory.trim(),
      }, {headers: {'X-CSRF-TOKEN': csrfToken}, withCredentials: true});
      setNewCategory("");
      fetchCategories();
      setError("");
    } catch (err) {
      setError("Failed to add category");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    
    setLoading(true);
    try {
      const csrfToken = Cookies.get('csrf_access_token');
      await axios.delete(`${API_URL}/admin/categories/${id}`, {
        headers: { 'X-CSRF-TOKEN': csrfToken },
        withCredentials: true,
      }
      );
      fetchCategories();
      setError("");
    } catch (err) {
      setError("Failed to delete category");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryUpdate = async (id) => {
    if (!editName.trim()) return;
    
    setLoading(true);
    try {
      await axios.put(`${API_URL}/admin/categories/${id}`, {
        name: editName.trim(),
      }, {headers: {'X-CSRF-TOKEN': Cookies.get('csrf_access_token')}, withCredentials: true});
      setEditMode(null);
      setEditName("");
      fetchCategories();
      setError("");
    } catch (err) {
      setError("Failed to update category");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-sm text-slate-600">Manage your categories</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <Tag className="w-4 h-4" />
              <span>{categories.length} Categories</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <X className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Add Category Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Plus className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900">Add New Category</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={newCategory}
                placeholder="Enter category name..."
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleCategoryAdd)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                disabled={loading}
              />
            </div>
            <button
              onClick={handleCategoryAdd}
              disabled={loading || !newCategory.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center space-x-3">
              <Tag className="w-5 h-5 text-slate-600" />
              <span>Categories</span>
            </h2>
          </div>

          <div className="divide-y divide-slate-200">
            {loading && categories.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-slate-600">Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="p-8 text-center">
                <Tag className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">No categories found</p>
                <p className="text-slate-500 text-sm mt-1">Add your first category to get started</p>
              </div>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="p-4 hover:bg-slate-50 transition-colors">
                  {editMode === cat.id ? (
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyPress={(e) => handleKeyPress(e, () => handleCategoryUpdate(cat.id))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCategoryUpdate(cat.id)}
                          disabled={loading}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditMode(null);
                            setEditName("");
                          }}
                          disabled={loading}
                          className="p-2 text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-slate-900 font-medium">{cat.name}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditMode(cat.id);
                            setEditName(cat.name);
                          }}
                          disabled={loading}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCategoryDelete(cat.id)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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

export default CategoryManager;