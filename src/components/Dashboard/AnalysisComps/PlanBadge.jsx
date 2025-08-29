import { motion } from 'framer-motion';
import { Crown, Zap, Shield } from 'lucide-react';

const getPlanIcon = (plan) => {
  switch (plan) {
    case 'pro': return <Crown className="w-5 h-5 text-yellow-400" />;
    case 'premium': return <Zap className="w-5 h-5 text-purple-400" />;
    default: return <Shield className="w-5 h-5 text-gray-400" />;
  }
};

const getPlanColor = (plan) => {
  switch (plan) {
    case 'pro': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
    case 'premium': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
    default: return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
  }
};

const PlanBadge = ({ plan, className = "" }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPlanColor(plan)} ${className}`}
  >
    {getPlanIcon(plan)}
    <span className="ml-2 capitalize">{plan}</span>
  </motion.div>
);

export default PlanBadge;