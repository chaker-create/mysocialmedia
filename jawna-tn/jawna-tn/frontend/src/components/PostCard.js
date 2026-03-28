import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';
import Avatar from './Avatar';
import CommentsPanel from './CommentsPanel';
import { REACTIONS } from '../utils/constants';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const API_BASE = '';

export default function PostCard({ post: initialPost, onDelete }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(initialPost);
  const [reacting, setReacting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [animReaction, setAnimReaction] = useState(null);

  const totalReactions = Object.values(post.reactions || {}).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  const handleReact = useCallback(async (reactionKey) => {
    if (reacting) return;
    setReacting(true);
    setAnimReaction(reactionKey);
    setTimeout(() => setAnimReaction(null), 300);

    // Optimistic update
    const prev = post;
    setPost(p => {
      const newReactions = {};
      REACTIONS.forEach(r => {
        newReactions[r.key] = [...(p.reactions[r.key] || [])].filter(id => id !== user._id && id?._id !== user._id);
      });
      newReactions[reactionKey] = [...newReactions[reactionKey], user._id];
      const score = REACTIONS.reduce((s, r) => s + (newReactions[r.key].length * r.weight), 0);
      return { ...p, reactions: newReactions, trendScore: score, userReaction: reactionKey };
    });

    try {
      const res = await api.post(`/posts/${post._id}/react`, { reaction: reactionKey });
      setPost(p => ({ ...p, reactions: res.data.reactions, trendScore: res.data.trendScore }));
    } catch (err) {
      setPost(prev);
      toast.error('فشل التفاعل');
    } finally {
      setReacting(false);
    }
  }, [post, reacting, user._id]);

  const handleDelete = async () => {
    if (!window.confirm('تأكيد الحذف؟')) return;
    try {
      await api.delete(`/posts/${post._id}`);
      toast.success('تم الحذف');
      onDelete?.(post._id);
    } catch {
      toast.error('فشل الحذف');
    }
  };

  const isOwner = user._id === (post.author?._id || post.author);
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ar });

  return (
    <article className="card post-card animate-slide-up mb-3">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <button onClick={() => !post.isAnonymous && navigate(`/profile/${post.author?._id || post.author}`)}>
            <Avatar user={post.author} size="md" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">
                {post.isAnonymous ? 'مجهول 🎭' : `@${post.author?.username}`}
              </span>
              {post.trendScore > 10 && (
                <span className="badge badge-fire">🔥 ترند</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-zinc-500">{timeAgo}</span>
              {post.city && (
                <>
                  <span className="text-zinc-700">·</span>
                  <span className="text-xs text-zinc-500">📍 {post.city}</span>
                </>
              )}
            </div>
          </div>
        </div>
        {isOwner && (
          <button onClick={handleDelete} className="text-zinc-600 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-zinc-800">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/><path d="M10,11v6"/><path d="M14,11v6"/><path d="M9,6V4h6v2"/>
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <p className="text-zinc-100 leading-relaxed mb-3 text-[15px] font-arabic whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Image */}
      {post.image && (
        <div className="mb-3 rounded-xl overflow-hidden bg-zinc-800">
          <img
            src={`${API_BASE}${post.image}`}
            alt="post"
            className="w-full max-h-80 object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Reactions */}
      <div className="flex items-center gap-2 flex-wrap mt-1">
        {REACTIONS.map(({ key, emoji, label }) => {
          const count = post.reactions?.[key]?.length || 0;
          const isActive = post.userReaction === key;
          return (
            <button
              key={key}
              onClick={() => handleReact(key)}
              className={`reaction-btn ${isActive ? 'active' : ''} ${animReaction === key ? 'animate-pop' : ''}`}
              title={label}
            >
              <span className={`text-base transition-transform ${animReaction === key ? 'scale-125' : ''}`}>
                {emoji}
              </span>
              <span className={isActive ? 'text-orange-400' : 'text-zinc-400'}>{count}</span>
            </button>
          );
        })}

        {/* Comments toggle */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="reaction-btn mr-auto"
        >
          <span>💬</span>
          <span className="text-zinc-400">{post.commentCount || 0}</span>
        </button>

        {/* Score badge */}
        {post.trendScore > 0 && (
          <span className="text-xs text-zinc-600 font-mono mr-1">
            ⚡{post.trendScore}
          </span>
        )}
      </div>

      {/* Comments panel */}
      {showComments && (
        <CommentsPanel
          postId={post._id}
          onCountChange={delta => setPost(p => ({ ...p, commentCount: (p.commentCount || 0) + delta }))}
        />
      )}
    </article>
  );
}
