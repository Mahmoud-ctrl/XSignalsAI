import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

// Drawer component for mobile view
const Drawer = ({ isOpen, onClose, children }) => {
    useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }

  return () => {
    document.body.style.overflow = '';
  };
}, [isOpen]);
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          />
          <motion.div
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`fixed top-0 left-0 h-full w-full max-w-sm bg-white z-[9995] p-6 overflow-y-auto`}
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 z-10">
                <X size={24} />
            </button>
            <div className="mt-8 h-full">
                {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};



export default Drawer;