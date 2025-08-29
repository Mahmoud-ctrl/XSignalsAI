import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navigate, Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { ScaleLoader } from "react-spinners";
import { useAuth } from "../App"; // Import the useAuth hook

const ProtectedRoutes = () => {
  const [showError, setShowError] = useState(false);
  const navigate = useNavigate();
  const { authenticated, loading } = useAuth(); // Use the auth context

  function OrbitsBackground() {
    // Subtle motion rings and dots to match the landing motif without heavy gradients.
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Soft vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_30%_20%,rgba(255,255,255,0.05),rgba(0,0,0,0))]" />
        {/* Animated rings */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-[1200px] w-[1200px] -translate-x-1/2 -translate-y-1/2"
          animate={{ rotate: 360 }}
          transition={{ duration: 80, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <div className="absolute inset-0 rounded-full border border-orange-500/10" />
          <div className="absolute inset-6 rounded-full border border-orange-500/10" />
          <div className="absolute inset-12 rounded-full border border-orange-500/10" />
          <div className="absolute inset-20 rounded-full border border-orange-500/10" />
        </motion.div>

        {/* Floating accent dots */}
        {[
          { x: "15%", y: "30%", delay: 0 },
          { x: "75%", y: "20%", delay: 0.6 },
          { x: "65%", y: "70%", delay: 1.2 },
        ].map((d, i) => (
          <motion.span
            key={i}
            className="absolute h-2 w-2 rounded-full bg-orange-500/70 shadow-[0_0_20px_4px_rgba(249,115,22,0.35)]"
            style={{ left: d.x, top: d.y }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, delay: d.delay, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        ))}
      </div>
    )
  }

  // Delay showing error card for 2 seconds if unauthenticated
  useEffect(() => {
    if (authenticated === false) {
      const timer = setTimeout(() => {
        setShowError(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [authenticated]);

  if (loading) {
    return (
      <div className="bg-[#0b0d12] fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
        <OrbitsBackground />
        <ScaleLoader
          loading={true}
          color="#eb5a0c"
          size={70}
          speedMultiplier={1.5}
        />
      </div>
    );
  }

  if (!authenticated) {
    return showError ? (
      navigate("/login")
    ) : (
      <div className="bg-[#0b0d12] fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
        <OrbitsBackground />
        <ScaleLoader
          loading={true}
          color="#eb5a0c"
          size={70}
          speedMultiplier={1.5}
        />
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoutes;