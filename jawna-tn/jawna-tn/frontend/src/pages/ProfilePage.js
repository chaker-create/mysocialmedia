import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import PostSkeleton from '../components/PostSkeleton';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser, setUser } = useAuth();
  const navigate = useNavigate();
  const isMe = userId === currentUser?._id;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', city: '' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userRes, postsRes] = await Promise.all([
          api.get(`/users/${userId}`),
          api.get(`/posts?sort=recent&limit=50`)
        ]);
        setProfile(userRes.data);
        setEditForm({ bio: userRes.data.bio || '', city: userRes.data.city || '' });
        const userPosts = postsRes.data.filter(p => {
          const authorId = p.author?._id || p.author;
          return authorId === userId && !p.isAnonymous;
        });
        setPosts(userPosts);
      } catch {
        toast.error('فشل تحميل الملف الشخصي');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handleSave = async () => {
    try {
      const res = await api.put('/users/me', editForm);
      setProfile(res.data);
      setUser(res.data);
      setEditing(false);
      toast.success('تم الحفظ ✅');
    } catch {
      toast.error('فشل الحفظ');
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="card animate-pulse">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full skeleton" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-5 w-32 rounded" />
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-3 w-48 rounded" />
          </div>
        </div>
      </div>
      {[1,2].map(i => <PostSkeleton key={i} />)}
    </div>
  );

  if (!profile) return (
    <div className="text-center py-16">
      <p className="text-zinc-500">ما لقيناش هاذا المستخدم 🤷</p>
    </div>
  );

  const totalReactions = posts.reduce((sum, p) => {
    return sum + Object.values(p.reactions || {}).reduce((s, arr) => s + arr.length, 0);
  }, 0);

  return (
    <div className="animate-fade-in">
      {/* Profile card */}
      <div className="card mb-4">
        <div className="flex items-start gap-4 mb-4">
          <Avatar user={profile} size="xl" />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">@{profile.username}</h2>
                <p className="text-zinc-500 text-sm mt-0.5">📍 {profile.city}</p>
              </div>
              {isMe ? (
                <button onClick={() => setEditing(!editing)} className="btn-ghost text-sm">
                  {editing ? 'إلغاء' : '✏️ تعديل'}
                </button>
              ) : (
                <button onClick={() => navigate(`/messages/${profile._id}`)} className="btn-primary text-sm py-2">
                  💬 راسل
                </button>
              )}
            </div>

            {editing ? (
              <div className="mt-3 space-y-2">
                <input
                  value={editForm.bio}
                  onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="أكتب نبذة عنك..."
                  className="input-field text-sm py-2"
                  maxLength={150}
                />
                <button onClick={handleSave} className="btn-primary text-sm py-2 w-full">حفظ</button>
              </div>
            ) : profile.bio ? (
              <p className="text-zinc-300 text-sm mt-2 font-arabic">{profile.bio}</p>
            ) : isMe ? (
              <button onClick={() => setEditing(true)} className="text-xs text-zinc-600 mt-2 hover:text-zinc-400">
                + أضف نبذة
              </button>
            ) : null}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-zinc-800">
          {[
            { label: 'منشورات', value: posts.length, icon: '📝' },
            { label: 'نقاط', value: profile.points || 0, icon: '⚡' },
            { label: 'تفاعلات', value: totalReactions, icon: '🔥' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-lg font-black text-white">{stat.value}</p>
              <p className="text-xs text-zinc-500">{stat.icon} {stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* User's posts */}
      <h3 className="text-sm font-bold text-zinc-400 mb-3 px-1">منشوراته 📋</h3>
      {posts.length === 0 ? (
        <div className="text-center py-10 card">
          <span className="text-4xl mb-3 block">🌙</span>
          <p className="text-zinc-500 font-arabic">ما نشرش بعد</p>
        </div>
      ) : (
        posts.map(post => (
          <PostCard key={post._id} post={post} onDelete={id => setPosts(prev => prev.filter(p => p._id !== id))} />
        ))
      )}
    </div>
  );
}
