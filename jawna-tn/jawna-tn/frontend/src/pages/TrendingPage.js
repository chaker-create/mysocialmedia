import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PostCard from '../components/PostCard';
import PostSkeleton from '../components/PostSkeleton';
import api from '../utils/api';
import { SCORE_FORMULA } from '../utils/constants';

export default function TrendingPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/posts/trending')
      .then(res => setPosts(res.data))
      .catch(() => toast.error('فشل التحميل'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id) => setPosts(prev => prev.filter(p => p._id !== id));

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center text-xl">🔥</div>
          <h1 className="text-xl font-display font-black text-white">الترندات</h1>
        </div>
        <p className="text-xs text-zinc-500 font-arabic">
          📊 Score = <span className="font-mono text-orange-400">{SCORE_FORMULA}</span>
        </p>
      </div>

      {/* Top 3 podium */}
      {!loading && posts.length >= 3 && (
        <div className="flex items-end justify-center gap-2 mb-6 h-28">
          {[1, 0, 2].map((rank, pos) => {
            const post = posts[rank];
            if (!post) return null;
            const heights = [20, 28, 16];
            const medals = ['🥈', '🥇', '🥉'];
            const colors = ['bg-zinc-600', 'bg-gradient-to-t from-orange-600 to-yellow-400', 'bg-amber-700'];
            return (
              <div key={rank} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-lg">{medals[pos]}</span>
                <p className="text-xs text-zinc-400 truncate max-w-full px-1 text-center">
                  {post.isAnonymous ? 'مجهول' : `@${post.author?.username}`}
                </p>
                <div className={`w-full ${colors[pos]} rounded-t-xl flex items-end justify-center pb-2`}
                  style={{ height: `${heights[pos]}%`, minHeight: 40 }}>
                  <span className="text-white font-bold text-xs">⚡{post.trendScore}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Posts list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <PostSkeleton key={i} />)}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl mb-4 block">📊</span>
          <p className="text-zinc-500 font-arabic">ما كاش ترندات بعد</p>
        </div>
      ) : (
        <div>
          {posts.map((post, idx) => (
            <div key={post._id} className="relative">
              {idx < 10 && (
                <div className="absolute -right-1 -top-1 z-10 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-black shadow-lg">
                  {idx + 1}
                </div>
              )}
              <PostCard post={post} onDelete={handleDelete} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
