import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import PostCard from '../components/PostCard';
import PostSkeleton from '../components/PostSkeleton';
import api from '../utils/api';
import { getSocket } from '../utils/socket';
import { TUNISIAN_CITIES } from '../utils/constants';

const SortIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/>
    <line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/>
  </svg>
);

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState('recent');
  const [cityFilter, setCityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);

  const fetchPosts = useCallback(async (pageNum = 1, reset = false) => {
    if (pageNum === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ sort, page: pageNum, limit: 15 });
      if (cityFilter) params.append('city', cityFilter);
      const res = await api.get(`/posts?${params}`);
      const newPosts = res.data;
      if (reset || pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prev => {
          const ids = new Set(prev.map(p => p._id));
          return [...prev, ...newPosts.filter(p => !ids.has(p._id))];
        });
      }
      setHasMore(newPosts.length === 15);
    } catch {
      toast.error('فشل تحميل المنشورات');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sort, cityFilter]);

  useEffect(() => {
    setPage(1);
    fetchPosts(1, true);
  }, [sort, cityFilter, fetchPosts]);

  // Realtime new posts
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (post) => {
      if (sort === 'recent') {
        setPosts(prev => {
          if (prev.some(p => p._id === post._id)) return prev;
          return [post, ...prev];
        });
      }
    };
    const reactionHandler = ({ postId, reactions, trendScore }) => {
      setPosts(prev => prev.map(p =>
        p._id === postId ? { ...p, reactions, trendScore } : p
      ));
    };
    socket.on('new_post', handler);
    socket.on('reaction_update', reactionHandler);
    return () => { socket.off('new_post', handler); socket.off('reaction_update', reactionHandler); };
  }, [sort]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPosts(nextPage);
      }
    }, { threshold: 0.5 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchPosts]);

  const handleDelete = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  return (
    <div>
      {/* Filters bar */}
      <div className="flex items-center gap-2 mb-4 sticky top-14 z-30 bg-zinc-950/90 backdrop-blur-md py-2 -mx-4 px-4 border-b border-zinc-800/40">
        {/* Sort toggle */}
        <div className="flex bg-zinc-900 rounded-xl p-1 gap-1 border border-zinc-800">
          <button
            onClick={() => setSort('recent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sort === 'recent' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            🕐 أحدث
          </button>
          <button
            onClick={() => setSort('trending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sort === 'trending' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            🔥 ترند
          </button>
        </div>

        {/* City filter */}
        <select
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-orange-500"
        >
          <option value="">كل المدن 📍</option>
          {TUNISIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <PostSkeleton key={i} />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl mb-4 block">😴</span>
          <p className="text-zinc-500 text-lg font-arabic">ما كاش منشورات بعد</p>
          <p className="text-zinc-600 text-sm mt-1">كن أول من ينشر! 🚀</p>
        </div>
      ) : (
        <>
          {posts.map(post => (
            <PostCard key={post._id} post={post} onDelete={handleDelete} />
          ))}
          {/* Infinite scroll loader */}
          <div ref={loaderRef} className="py-4 text-center">
            {loadingMore && (
              <div className="flex justify-center gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-orange-500"
                    style={{ animation: `bounce 0.6s ease-in-out ${i*0.15}s infinite alternate` }} />
                ))}
              </div>
            )}
            {!hasMore && posts.length > 0 && (
              <p className="text-zinc-700 text-xs">وصلت للآخر 🎉</p>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
