// App.jsx
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Navbar from "./components/Navbar";
import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import Footer from "./components/Footer";
import Dashboard from "./pages/Dashboard";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import PricingPage from "./pages/Pricing";
import Lenis from 'lenis';
import ForgotPassword from "./pages/ForgotPassword";
import ProtectedRoutes from "./components/ProtectedRoutes";
import axios from "axios";

const API_URL = import.meta.env.VITE_REACT_APP_API;

// Create Authentication Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_URL}/check-auth`, {
        withCredentials: true,
      });
      setAuthenticated(response.data.authenticated);
      if (response.data.authenticated && response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.log("Auth check failed:", error);
      setAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthenticated(false);
    setUser(null);
    localStorage.removeItem("user");
    // You might want to call your logout API endpoint here too
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    authenticated,
    loading,
    user,
    checkAuth,
    logout,
    setAuthenticated,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

function AppContent() {
  const location = useLocation();
  const { authenticated, loading } = useAuth();
  
  const isHomeRoute = location.pathname === '/' || location.pathname === '/pricing';
  const dashboardTabs = ['dashboard', 'analytics', 'signals', 'portfolio', 'reports', 'settings', 'signup', 'login', 'forgot-password'];
  const isDashboardRoute = dashboardTabs.some(tab => location.pathname.startsWith(`/${tab}`));
  
  const [scrolled, setScrolled] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const lenisRef = useRef(null);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    if (isHomeRoute) {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
      });

      lenisRef.current = lenis;

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);

      return () => {
        lenis.destroy();
      };
    }
  }, [isHomeRoute]);

  // Handle navbar visibility with Lenis scroll
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDifference = Math.abs(currentScrollY - lastScrollY);
          
          // Set scrolled state for background styling
          setScrolled(currentScrollY > 150);
          
          // Only update if scroll difference is significant enough (reduces jumpiness)
          if (scrollDifference < 5) {
            ticking = false;
            return;
          }
          
          // Hide/show navbar based on scroll direction
          if (currentScrollY < 20) {
            // Always show navbar at the top (increased from 10 to 20 for smoother transition)
            setIsNavbarVisible(true);
          } else if (currentScrollY > lastScrollY && currentScrollY > 150) {
            // Scrolling down - hide navbar (increased threshold for mobile)
            setIsNavbarVisible(false);
          } else if (currentScrollY < lastScrollY && scrollDifference > 10) {
            // Scrolling up - show navbar (only if scroll up is significant)
            setIsNavbarVisible(true);
          }
          
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    if (isHomeRoute && lenisRef.current) {
      // Use Lenis scroll event instead of window scroll for better performance
      lenisRef.current.on('scroll', handleScroll);
    } else if (isHomeRoute) {
      // Fallback to window scroll if Lenis not ready
      window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      // For non-home routes, always show navbar
      setIsNavbarVisible(true);
    }

    return () => {
      if (lenisRef.current) {
        lenisRef.current.off('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHomeRoute, lastScrollY, lenisRef.current]);

  // Determine navbar background based on route and scroll
  const getNavbarBg = () => {
    if (isDashboardRoute) return "bg-[#080809]";
    if (isHomeRoute && scrolled) return "bg-[#080809]";
    return "bg-transparent";
  };

  // Clean up Lenis on route change
  useEffect(() => {
    if (!isHomeRoute && lenisRef.current) {
      lenisRef.current.destroy();
      lenisRef.current = null;
    }
  }, [isHomeRoute]);

  return (
    <>
      {/* Single navbar that adapts based on route and scroll */}
      {(isHomeRoute || !isDashboardRoute) && (
        <Navbar 
          bgColor={getNavbarBg()}
          className={`transition-all duration-300 ${
            isHomeRoute && !scrolled 
              ? 'bg-transparent backdrop-blur-none' 
              : 'bg-transparent backdrop-blur-none'
          } ${
            isNavbarVisible ? 'md:translate-y-0 opacity-100' : '-translate-y-full opacity-0'
          }`}
          // Pass authentication state to Navbar
          authenticated={authenticated}
          authLoading={loading}
        />
      )}
      
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/pricing" element={<PricingPage />} />
        {/* Protected routes */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/:tab" element={<Dashboard />} />
        </Route>
      </Routes>

      {isHomeRoute && <Footer />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;