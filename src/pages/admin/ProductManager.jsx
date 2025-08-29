import React, { useEffect, useState } from 'react';
import { Upload, X, Plus, Edit, Save, Package, Tag, DollarSign, Camera, Star, Filter, Menu, Pencil, Trash } from 'lucide-react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_REACT_APP_API;
import Cookies from 'js-cookie';

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    original_price: '',
    review_count: 0,
    in_stock: true,
    is_new: false,
    is_sale: false,
    sales_count: 0,
    category_id: '',
    brand_id: '',
    images: []
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageLinks, setImageLinks] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Filter states
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [availableFilterBrands, setAvailableFilterBrands] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Fetch products with optional filters
  const fetchProducts = async (pageNum = page, categoryId = '', brandId = '') => {
    try {
      let url = `${API_URL}/admin/products?page=${pageNum}&per_page=${perPage}`;
      if (categoryId) url += `&category_id=${categoryId}`;
      if (brandId) url += `&brand_id=${brandId}`;
      
      const res = await axios.get(url, {
        withCredentials: true,
      });
      setProducts(res.data.products);
      setPage(res.data.page);
      setPerPage(res.data.per_page);
      setTotalPages(res.data.total_pages);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/categories`, { withCredentials: true });
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBrands = async (categoryId = '') => {
    try {
      let url = `${API_URL}/admin/brands`;
      if (categoryId) url += `?category_id=${categoryId}`;
      
      const res = await axios.get(url, { withCredentials: true });
      setBrands(res.data);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchFilterBrands = async (categoryId = '') => {
    try {
      let url = `${API_URL}/admin/brands`;
      if (categoryId) url += `?category_id=${categoryId}`;
      
      const res = await axios.get(url, { withCredentials: true });
      setAvailableFilterBrands(res.data);
    } catch (error) {
      console.error('Error fetching filter brands:', error);
    }
  };

  // Handle category change in form
  const handleCategoryChange = (categoryId) => {
    setForm({ ...form, category_id: categoryId, brand_id: '' });
    setBrands([]);
    if (categoryId) {
      fetchBrands(categoryId);
    }
  };

  // Handle filter category change
  const handleFilterCategoryChange = (categoryId) => {
    setFilterCategory(categoryId);
    setFilterBrand('');
    setAvailableFilterBrands([]);
    if (categoryId) {
      fetchFilterBrands(categoryId);
    }
    setPage(1);
    fetchProducts(1, categoryId, '');
  };

  // Handle filter brand change
  const handleFilterBrandChange = (brandId) => {
    setFilterBrand(brandId);
    setPage(1);
    fetchProducts(1, filterCategory, brandId);
  };

  // Clear filters
  const clearFilters = () => {
    setFilterCategory('');
    setFilterBrand('');
    setAvailableFilterBrands([]);
    setPage(1);
    fetchProducts(1, '', '');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setImageFiles(prev => [...prev, ...imageFiles]);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    const urls = [];
    for (let file of imageFiles) {
      if (typeof file === 'string') {
        urls.push(file); // Already a link
      } else {
        const formData = new FormData();
        formData.append('file', file);
        try {
          const res = await axios.post(`${API_URL}/admin/upload`, formData);
          urls.push(res.data.url);
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!form.title || !form.price || !form.brand_id) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const imageUrls = await uploadImages();
      const data = { ...form, images: imageUrls };

      if (data.price === "") data.price = null;
      if (data.original_price === "") data.original_price = null;

      const res = await axios.post(`${API_URL}/admin/products`, data);
      alert('Product added: ' + res.data.title);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error adding product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (id) => {
    setIsLoading(true);
    try {
      const imageUrls = await uploadImages();
      const data = { ...form, images: imageUrls.length ? imageUrls : form.images };
      
      const res = await axios.put(`${API_URL}/admin/products/${id}`, data, {
        withCredentials: true
      });
        
      alert('Product updated: ' + res.data.title);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error updating product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const csrf = Cookies.get('csrf_access_token');
    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/admin/products/${id}`, {
         withCredentials: true,
         headers: {
            'X-CSRF-TOKEN': csrf
         } 
        });
      alert('Product deleted');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      price: '',
      original_price: '',
      review_count: 0,
      in_stock: true,
      is_new: false,
      is_sale: false,
      sales_count: 0,
      category_id: '',
      brand_id: '',
      images: []
    });
    setImageFiles([]);
    setEditingProduct(null);
    setBrands([]);
  };

  const editProduct = (product) => {
    setForm(product);
    setEditingProduct(product.id);
    setImageFiles([]);
    
    if (product.category_id) {
      fetchBrands(product.category_id);
    }
  };

  const addImageLink = () => {
    if (imageLinks.trim()) {
      setImageFiles(prev => [...prev, imageLinks.trim()]);
      setImageLinks('');
    }
  };

  // Generate page numbers for pagination
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

   return (
    <div>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Product Manager
          </h1>
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Filters Overlay */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowMobileFilters(false)}>
          <div className="bg-white w-full max-w-sm h-full p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-1 rounded-md hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filterCategory}
                  onChange={e => handleFilterCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                <select
                  value={filterBrand}
                  onChange={e => handleFilterBrandChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!filterCategory}
                >
                  <option value="">
                    {!filterCategory ? 'All Brands' : 'All Brands in Category'}
                  </option>
                  {availableFilterBrands.map(brand => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              {(filterCategory || filterBrand) && (
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Desktop Header */}
          <div className="hidden lg:block px-6 py-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6 text-grey-900"/>
              <span className='text-grey-900'>Product Manager</span>
            </h1>
          </div>

          <div className="p-4 lg:p-6">
            {/* Form Section */}
            <div className="bg-gray-50 rounded-lg p-4 lg:p-6 mb-6 lg:mb-8">
              <h2 className="text-lg lg:text-xl font-semibold mb-4 lg:mb-6 flex items-center gap-2">
                {editingProduct ? <Edit className="w-4 h-4 lg:w-5 lg:h-5" /> : <Plus className="w-4 h-4 lg:w-5 lg:h-5" />}
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Title *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter product title"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      placeholder="Enter product description"
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          placeholder="0.00"
                          value={form.price}
                          onChange={e => setForm({ ...form, price: e.target.value })}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Original Price
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          placeholder="0.00"
                          value={form.original_price}
                          onChange={e => setForm({ ...form, original_price: e.target.value })}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <select
                        value={form.category_id}
                        onChange={e => handleCategoryChange(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand *
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <select
                        value={form.brand_id}
                        onChange={e => setForm({ ...form, brand_id: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!form.category_id}
                      >
                        <option value="">
                          {!form.category_id ? 'Select Category First' : 'Select Brand'}
                        </option>
                        {brands.map(brand => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Image Upload Drop Zone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Images
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 lg:p-6 text-center transition-colors ${
                        dragActive 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="fileInput"
                      />
                      <label htmlFor="fileInput" className="cursor-pointer">
                        <Camera className="w-8 h-8 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 mb-2 text-sm lg:text-base">
                          Drag and drop images here, or click to select
                        </p>
                        <p className="text-xs lg:text-sm text-gray-500">
                          PNG, JPG, GIF up to 10MB each
                        </p>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Paste image URL"
                      value={imageLinks}
                      onChange={e => setImageLinks(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addImageLink}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
                    >
                      Add Link
                    </button>
                  </div>

                  {/* Image Preview */}
                  {imageFiles.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selected Images ({imageFiles.length})
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {imageFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={typeof file === 'string' ? file : URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 object-cover rounded-md"
                            />
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Options
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.in_stock}
                          onChange={e => setForm({ ...form, in_stock: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">In Stock</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.is_new}
                          onChange={e => setForm({ ...form, is_new: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">New Product</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.is_sale}
                          onChange={e => setForm({ ...form, is_sale: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">On Sale</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={editingProduct ? () => handleUpdate(editingProduct) : handleSubmit}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {editingProduct ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {editingProduct ? 'Update Product' : 'Add Product'}
                    </>
                  )}
                </button>
                {editingProduct && (
                  <button
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Products List */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-lg lg:text-xl font-semibold">Existing Products</h2>
                
                {/* Desktop Filters */}
                <div className="hidden lg:flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Filters:</span>
                  </div>
                  
                  <select
                    value={filterCategory}
                    onChange={e => handleFilterCategoryChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterBrand}
                    onChange={e => handleFilterBrandChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={!filterCategory}
                  >
                    <option value="">
                      {!filterCategory ? 'All Brands' : 'All Brands in Category'}
                    </option>
                    {availableFilterBrands.map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>

                  {(filterCategory || filterBrand) && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* Mobile Filter Button */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {products.map(product => (
                  <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-w-16 aspect-h-9">
                      <img
                        src={product.images[0] || 'https://via.placeholder.com/300x200?text=No+Image'}
                        alt={product.title}
                        className="w-full h-32 sm:h-48 object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-base lg:text-lg mb-2 truncate">{product.title}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg lg:text-xl font-bold text-blue-600">${product.price}</span>
                        {product.original_price && (
                          <span className="text-sm text-gray-500 line-through">${product.original_price}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editProduct(product)}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleUpdate(product.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Pencil className="w-3 h-3" />
                          Update
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                        >
                          <Trash className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => {
                      setPage(page - 1);
                      fetchProducts(page - 1, filterCategory, filterBrand);
                    }}
                    disabled={page === 1}
                    className="px-3 py-1 rounded-md border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  {getVisiblePages().map((p, idx) =>
                    p === '...' ? (
                      <span key={idx} className="px-2">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => {
                          setPage(p);
                          fetchProducts(p, filterCategory, filterBrand);
                        }}
                        className={`px-3 py-1 rounded-md border ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-100 border-gray-300'}`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => {
                      setPage(page + 1);
                      fetchProducts(page + 1, filterCategory, filterBrand);
                    }}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded-md border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProductManager;