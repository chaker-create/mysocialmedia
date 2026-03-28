import React from 'react';

const GRADIENTS = [
  'from-orange-500 to-pink-600',
  'from-blue-500 to-purple-600',
  'from-green-500 to-teal-600',
  'from-yellow-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-indigo-500 to-blue-600',
];

function getGradient(username) {
  if (!username) return GRADIENTS[0];
  const idx = username.charCodeAt(0) % GRADIENTS.length;
  return GRADIENTS[idx];
}

export default function Avatar({ user, size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  const sizeClass = sizes[size] || sizes.md;
  const gradient = getGradient(user?.username);
  const initial = user?.username?.[0]?.toUpperCase() || '?';

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.username}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}>
      {initial}
    </div>
  );
}
