import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Tag, Award, ShoppingBag, X, LogOut, Settings, Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH;
const API_URL = import.meta.env.VITE_REACT_APP_API;

const AdminLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: `/`, icon: <Home className="mr-3" size={18} />, label: "Home" },
    { path: `/hasan/admin/dashboard`, icon: <Settings className="mr-3" size={18} />, label: "Dashboard" },
    { path: `/hasan/admin/categories`, icon: <Tag className="mr-3" size={18} />, label: "Categories" },
    { path: `/hasan/admin/brands`, icon: <Award className="mr-3" size={18} />, label: "Brands" },
    { path: `/hasan/admin/products`, icon: <ShoppingBag className="mr-3" size={18} />, label: "Products" },
  ];

  const navigate = useNavigate();
  
   const handleLogout = async () => {
   try {
       const csrfToken = Cookies.get("csrf_access_token");
       await fetch(`${API_URL}/admin/logout`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'X-CSRF-TOKEN': csrfToken
         },
         credentials: 'include', 
       });
        Cookies.remove("csrf_access_token");
       navigate('/');
     } catch (error) {
       console.error("Logout failed:", error);
     }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Close sidebar when clicking on a nav item on mobile
  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-gray-100 lg:h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          sidebarOpen ? 'translate-x-0 z-[9995]' : '-translate-x-full z-50'
        } lg:relative lg:translate-x-0 lg:z-auto transition-transform duration-300 ease-in-out w-64 bg-gray-800 text-white shadow-xl lg:shadow-lg`}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-gray-700">
          <h1 className="text-xl font-bold">Admin Panel</h1>
          {/* Close button for mobile */}
          <button
            onClick={closeSidebar}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Logout button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            
            className="flex items-center w-full px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="mr-3" size={18} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 lg:overflow-hidden bg-gray-100">
        {/* Mobile menu button */}
        <div className="lg:hidden p-4 flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 py-4 rounded-xl font-semibold shadow"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            <Settings size={20} />
            Open Menu
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto lg:h-full">
          <div className="min-h-full">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;