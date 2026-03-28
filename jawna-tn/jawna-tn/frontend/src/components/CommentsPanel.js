import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';
import Avatar from './Avatar';
import api from '../utils/api';
import { getSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';

export default function CommentsPanel({ postId, onCountChange }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit('join_post', postId);
      socket.on('new_comment', (comment) => {
        setComments(prev => {
          if (prev.some(c => c._id === comment._id)) return prev;
          return [comment, ...prev];
        });
        onCountChange?.(1);
      });
      return () => {
        socket.emit('leave_post', postId);
        socket.off('new_comment');
      };
    }
  }, [postId, onCountChange]);

  useEffect(() => {
    api.get(`/comments/${postId}`)
      .then(res => setComments(res.data))
      .catch(() => toast.error('فشل تحميل التعليقات'))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/comments/${postId}`, { content: text.trim(), isAnonymous: anonymous });
      setComments(prev => {
        if (prev.some(c => c._id === res.data._id)) return prev;
        return [res.data, ...prev];
      });
      onCountChange?.(1);
      setText('');
    } catch {
      toast.error('فشل إرسال التعليق');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-zinc-800 animate-fade-in">
      {/* Comment input */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
        <Avatar user={user} size="sm" className="flex-shrink-0 mt-0.5" />
        <div className="flex-1 flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="أكتب تعليق..."
            className="input-field py-2 text-sm flex-1"
            maxLength={300}
          />
          <button type="submit" disabled={!text.trim() || submitting} className="btn-primary py-2 px-3 text-sm">
            إرسال
          </button>
        </div>
      </form>

      {/* Anonymous toggle */}
      <label className="flex items-center gap-2 text-xs text-zinc-500 mb-3 cursor-pointer w-fit">
        <div
          onClick={() => setAnonymous(!anonymous)}
          className={`w-8 h-4 rounded-full transition-colors relative ${anonymous ? 'bg-orange-500' : 'bg-zinc-700'}`}
        >
          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${anonymous ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </div>
        تعليق مجهول
      </label>

      {/* Comments list */}
      {loading ? (
        <div className="space-y-2">
          {[1,2].map(i => <div key={i} className="skeleton h-10 rounded-xl" />)}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-zinc-600 text-sm py-3">لا تعليقات بعد. كن أول من يعلق! 💬</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {comments.map(comment => (
            <div key={comment._id} className="flex gap-2.5 animate-fade-in">
              <Avatar user={comment.author} size="sm" className="flex-shrink-0" />
              <div className="flex-1 bg-zinc-800/60 rounded-xl px-3 py-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-zinc-300">
                    {comment.isAnonymous ? 'مجهول 🎭' : `@${comment.author?.username}`}
                  </span>
                  <span className="text-xs text-zinc-600">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ar })}
                  </span>
                </div>
                <p className="text-sm text-zinc-200 font-arabic">{comment.content}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
