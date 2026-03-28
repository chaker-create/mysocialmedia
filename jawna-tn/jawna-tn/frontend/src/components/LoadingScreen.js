import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-50">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center shadow-2xl animate-bounce-in">
          <span className="text-3xl">🔥</span>
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-orange-500/30 blur-md animate-pulse" />
      </div>
      <h1 className="text-2xl font-display font-black gradient-text mb-2">JAWNA TN</h1>
      <div className="flex gap-1 mt-4">
        {[0,1,2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-orange-500"
            style={{ animation: `bounce 0.6s ease-in-out ${i * 0.15}s infinite alternate` }}
          />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          from { transform: translateY(0); opacity: 0.4; }
          to { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
