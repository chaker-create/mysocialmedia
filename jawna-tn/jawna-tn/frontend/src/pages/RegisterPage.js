import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { TUNISIAN_CITIES } from '../utils/constants';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', city: 'تونس' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('كلمة السر ما تتطابقش');
    if (form.password.length < 6) return toast.error('كلمة السر تحتاج 6 أحرف على الأقل');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        username: form.username,
        password: form.password,
        city: form.city
      });
      login(res.data.token, res.data.user);
      toast.success(`مرحبا ${res.data.user.username}! أهلا بيك في JAWNA TN 🎉`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل التسجيل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-pink-500/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-3xl shadow-2xl shadow-orange-500/30 mx-auto mb-4">
            🔥
          </div>
          <h1 className="text-3xl font-display font-black gradient-text">JAWNA TN</h1>
          <p className="text-zinc-500 mt-1 text-sm font-arabic">انضم للشباب التونسي</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-white mb-5 text-center">حساب جديد</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">اسم المستخدم</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                placeholder="username"
                className="input-field text-left"
                dir="ltr"
                minLength={3}
                maxLength={20}
                required
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">المدينة</label>
              <select
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                className="input-field"
              >
                {TUNISIAN_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
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
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block">تأكيد كلمة السر</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="input-field text-left"
                dir="ltr"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'جاري التسجيل...' : 'سجل الآن 🚀'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-4">
            عندك حساب؟{' '}
            <Link to="/login" className="text-orange-400 hover:text-orange-300 font-bold">
              سجل دخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
