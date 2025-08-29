export const getPlanColor = (plan) => {
  switch (plan) {
    case 'pro':
      return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
    case 'premium':
      return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
    default:
      return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
  }
};