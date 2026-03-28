import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomeIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="16"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);
const ChatIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);
const TrendIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/>
    <polyline points="17,6 23,6 23,12"/>
  </svg>
);
const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { to: '/', icon: HomeIcon, label: 'الرئيسية', end: true },
    { to: '/trending', icon: TrendIcon, label: 'ترند' },
    { to: '/create', icon: PlusIcon, label: 'نشر', isCreate: true },
    { to: '/messages', icon: ChatIcon, label: 'رسائل' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-sm shadow-lg">
              🔥
            </div>
            <span className="font-display font-black text-lg gradient-text tracking-tight">JAWNA TN</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ to, icon: Icon, label, end, isCreate }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all duration-150 ${
                      isCreate
                        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg'
                        : isActive
                          ? 'bg-zinc-800 text-orange-400'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                    }`
                  }
                >
                  <Icon active={false} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            {/* User avatar / menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm uppercase hover:scale-105 transition-transform"
              >
                {user?.username?.[0] || 'U'}
              </button>
              {menuOpen && (
                <div className="absolute left-0 top-10 bg-zinc-900 border border-zinc-700 rounded-2xl p-1 w-44 shadow-xl z-50 animate-fade-in">
                  <button
                    onClick={() => { navigate(`/profile/${user._id}`); setMenuOpen(false); }}
                    className="w-full text-right px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 rounded-xl flex items-center gap-2"
                  >
                    <UserIcon /> الملف الشخصي
                  </button>
                  <hr className="border-zinc-700 my-1" />
                  <button
                    onClick={logout}
                    className="w-full text-right px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 rounded-xl"
                  >
                    تسجيل خروج
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/60 bottom-nav">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ to, icon: Icon, label, end, isCreate }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                isCreate
                  ? 'flex flex-col items-center'
                  : `nav-link ${isActive ? 'active' : ''}`
              }
            >
              {({ isActive }) => (
                isCreate ? (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center shadow-lg shadow-orange-500/30 -mt-4">
                    <PlusIcon />
                  </div>
                ) : (
                  <>
                    <Icon active={isActive} />
                    <span>{label}</span>
                  </>
                )
              )}
            </NavLink>
          ))}
          {/* Profile tab mobile */}
          <button
            onClick={() => navigate(`/profile/${user?._id}`)}
            className="nav-link"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold uppercase">
              {user?.username?.[0] || 'U'}
            </div>
            <span>حسابي</span>
          </button>
        </div>
      </nav>

      {/* Backdrop for menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
}
