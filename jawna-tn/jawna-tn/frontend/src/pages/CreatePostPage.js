import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { TUNISIAN_CITIES } from '../utils/constants';

const MAX_CHARS = 500;

export default function CreatePostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [content, setContent] = useState('');
  const [city, setCity] = useState(user?.city || 'تونس');
  const [anonymous, setAnonymous] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const charsLeft = MAX_CHARS - content.length;

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('الصورة كبيرة جداً (max 5MB)');
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return toast.error('أكتب شيء أولاً 😅');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('city', city);
      formData.append('isAnonymous', anonymous);
      if (image) formData.append('image', image);

      await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('تم النشر! 🔥');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل النشر');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </div>
        <h1 className="text-xl font-display font-black text-white">منشور جديد</h1>
      </div>

      <div className="card">
        {/* User preview */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800">
          <Avatar user={anonymous ? null : user} size="md" />
          <div>
            <p className="font-bold text-sm text-white">
              {anonymous ? '🎭 مجهول' : `@${user?.username}`}
            </p>
            <p className="text-xs text-zinc-500">{city} · الآن</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Text area */}
          <div className="relative">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="شن قلبك يحكي؟ 😂🔥"
              className="input-field resize-none text-[15px] font-arabic leading-relaxed"
              rows={5}
              maxLength={MAX_CHARS}
              dir="auto"
            />
            <span className={`absolute bottom-3 left-3 text-xs font-mono ${charsLeft < 50 ? 'text-red-400' : 'text-zinc-600'}`}>
              {charsLeft}
            </span>
          </div>

          {/* Image preview */}
          {imagePreview && (
            <div className="relative rounded-xl overflow-hidden bg-zinc-800">
              <img src={imagePreview} alt="preview" className="w-full max-h-64 object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 left-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white text-sm transition-colors"
              >
                ×
              </button>
            </div>
          )}

          {/* Options row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* City picker */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-sm">📍</span>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-xl px-3 py-2 outline-none focus:border-orange-500"
              >
                {TUNISIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Image upload */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl transition-all"
            >
              🖼 صورة
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

            {/* Anonymous toggle */}
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer select-none">
              <div
                onClick={() => setAnonymous(!anonymous)}
                className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${anonymous ? 'bg-orange-500' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${anonymous ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span>🎭 مجهول</span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="btn-primary w-full text-base py-3"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                جاري النشر...
              </span>
            ) : '🔥 انشر الآن'}
          </button>
        </form>
      </div>

      {/* Tips */}
      <div className="mt-4 card bg-zinc-900/50 border-zinc-800/50">
        <p className="text-xs text-zinc-500 font-arabic leading-relaxed">
          💡 <strong className="text-zinc-400">نصيحة:</strong> المنشورات الترندية تجيب ليك نقاط أكثر!
          نظام النقاط: 😂×2 + 🔥×3 + 💀×1 + ❤️×2
        </p>
      </div>
    </div>
  );
}
