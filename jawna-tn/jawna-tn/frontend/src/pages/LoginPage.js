import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return toast.error('أدخل جميع البيانات');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.user);
      toast.success(`أهلا ${res.data.user.username}! 🔥`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'بيانات خاطئة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-3xl shadow-2xl shadow-orange-500/30 mx-auto mb-4 animate-bounce-in">
            🔥
          </div>
          <h1 className="text-3xl font-display font-black gradient-text">JAWNA TN</h1>
          <p className="text-zinc-500 mt-1 text-sm font-arabic">منصة الشباب التونسي</p>
        </div>

        {/* Form card */}
        <div className="card glow-orange">
          <h2 className="text-lg font-bold text-white mb-5 text-center">تسجيل الدخول</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">اسم المستخدم</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="username"
                className="input-field text-left"
                dir="ltr"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">كلمة السر</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="input-field text-left"
                dir="ltr"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  جاري الدخول...
                </span>
              ) : 'دخول 🚪'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-4">
            ما عندكش حساب؟{' '}
            <Link to="/register" className="text-orange-400 hover:text-orange-300 font-bold">
              سجل هنا
            </Link>
          </p>
        </div>

        {/* Demo hint */}
        <p className="text-center text-xs text-zinc-700 mt-4">
          Demo: jawna / jawna123
        </p>
      </div>
    </div>
  );
}
