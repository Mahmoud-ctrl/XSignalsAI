import { Crown, Zap, Shield } from 'lucide-react';

export default function PlanIcon({ plan }) {
  switch (plan) {
    case 'pro':
      return <Crown className="w-5 h-5 text-yellow-400" />;
    case 'premium':
      return <Zap className="w-5 h-5 text-purple-400" />;
    default:
      return <Shield className="w-5 h-5 text-gray-400" />;
  }
}
