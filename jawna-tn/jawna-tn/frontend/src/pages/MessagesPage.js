import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';
import Avatar from '../components/Avatar';
import api from '../utils/api';
import { getSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';

export default function MessagesPage() {
  const { user } = useAuth();
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeUserId, setActiveUserId] = useState(paramUserId || null);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [typing, setTyping] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  // Load conversations
  useEffect(() => {
    api.get('/messages/conversations')
      .then(res => setConversations(res.data))
      .catch(() => toast.error('فشل تحميل المحادثات'))
      .finally(() => setLoadingConvs(false));
  }, []);

  // Load messages for active chat
  useEffect(() => {
    if (!activeUserId) return;
    setLoadingMsgs(true);
    setMessages([]);
    api.get(`/messages/${activeUserId}`)
      .then(res => {
        setMessages(res.data);
        setTimeout(scrollToBottom, 100);
      })
      .catch(() => toast.error('فشل تحميل الرسائل'))
      .finally(() => setLoadingMsgs(false));

    // Load active user info
    api.get(`/users/${activeUserId}`)
      .then(res => setActiveUser(res.data))
      .catch(() => {});
  }, [activeUserId]);

  // Realtime messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (msg) => {
      const senderId = msg.sender?._id || msg.sender;
      const receiverId = msg.receiver?._id || msg.receiver;
      const isRelevant = senderId === activeUserId || receiverId === activeUserId;
      if (isRelevant) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setTimeout(scrollToBottom, 50);
      }
      // Update conversation list
      setConversations(prev => {
        const existIdx = prev.findIndex(c => c.conversationId === msg.conversation);
        const updatedConv = {
          conversationId: msg.conversation,
          otherUser: senderId === user._id ? msg.receiver : msg.sender,
          lastMessage: msg,
          unreadCount: isRelevant ? 0 : (prev[existIdx]?.unreadCount || 0) + 1
        };
        if (existIdx >= 0) {
          const updated = [...prev];
          updated[existIdx] = updatedConv;
          return updated;
        }
        return [updatedConv, ...prev];
      });
    };
    const typingHandler = ({ userId }) => {
      if (userId === activeUserId) setTyping(true);
    };
    const stopTypingHandler = ({ userId }) => {
      if (userId === activeUserId) setTyping(false);
    };

    socket.on('new_message', handler);
    socket.on('user_typing', typingHandler);
    socket.on('user_stop_typing', stopTypingHandler);
    return () => {
      socket.off('new_message', handler);
      socket.off('user_typing', typingHandler);
      socket.off('user_stop_typing', stopTypingHandler);
    };
  }, [activeUserId, user._id]);

  // User search
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/users/search?q=${search}`);
        setSearchResults(res.data);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeUserId || sending) return;
    setSending(true);
    const msgText = text.trim();
    setText('');

    // Optimistic
    const optimistic = {
      _id: `opt_${Date.now()}`,
      sender: { _id: user._id, username: user.username },
      receiver: { _id: activeUserId },
      content: msgText,
      createdAt: new Date().toISOString(),
      optimistic: true
    };
    setMessages(prev => [...prev, optimistic]);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await api.post(`/messages/${activeUserId}`, { content: msgText });
      setMessages(prev => prev.map(m => m._id === optimistic._id ? res.data : m));
    } catch {
      toast.error('فشل الإرسال');
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    const socket = getSocket();
    if (!socket || !activeUserId) return;
    socket.emit('typing', { conversationId: 'x', to: activeUserId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stop_typing', { conversationId: 'x', to: activeUserId });
    }, 1500);
  };

  const openChat = (uid) => {
    setActiveUserId(uid);
    navigate(`/messages/${uid}`);
    setSearch('');
    setSearchResults([]);
    inputRef.current?.focus();
  };

  const isMine = (msg) => {
    const sid = msg.sender?._id || msg.sender;
    return sid === user._id;
  };

  return (
    <div className="flex gap-0 md:gap-4 h-[calc(100vh-8rem)] -mx-4 md:mx-0">
      {/* Conversations sidebar */}
      <div className={`${activeUserId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 bg-zinc-900 md:rounded-2xl border border-zinc-800 flex-shrink-0`}>
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-base font-bold text-white mb-3">الرسائل 💬</h2>
          <div className="relative">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن مستخدم..."
              className="input-field text-sm py-2"
            />
            {search && (
              <button onClick={() => { setSearch(''); setSearchResults([]); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                ×
              </button>
            )}
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-1 border border-zinc-700 rounded-xl overflow-hidden">
              {searchResults.map(u => (
                <button key={u._id} onClick={() => openChat(u._id)}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-zinc-800 transition-colors text-right">
                  <Avatar user={u} size="sm" />
                  <div>
                    <p className="text-sm font-bold text-white">@{u.username}</p>
                    <p className="text-xs text-zinc-500">{u.city}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full mr-auto ${u.isOnline ? 'bg-green-500' : 'bg-zinc-600'}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-24 rounded" />
                    <div className="skeleton h-2 w-36 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-10 px-4">
              <span className="text-3xl mb-2 block">💬</span>
              <p className="text-zinc-500 text-sm font-arabic">ابدأ محادثة جديدة!</p>
            </div>
          ) : (
            conversations.map(conv => {
              const other = conv.otherUser;
              const isActive = activeUserId === other?._id;
              return (
                <button
                  key={conv.conversationId}
                  onClick={() => openChat(other._id)}
                  className={`w-full flex items-center gap-3 p-4 text-right hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/40 ${isActive ? 'bg-zinc-800' : ''}`}
                >
                  <div className="relative">
                    <Avatar user={other} size="sm" />
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${other?.isOnline ? 'bg-green-500' : 'bg-zinc-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">@{other?.username}</span>
                      {conv.lastMessage && (
                        <span className="text-xs text-zinc-600">
                          {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { locale: ar })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {conv.lastMessage?.content || '...'}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-xs text-white font-bold">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat panel */}
      <div className={`${!activeUserId ? 'hidden md:flex' : 'flex'} flex-col flex-1 bg-zinc-900 md:rounded-2xl border border-zinc-800 overflow-hidden`}>
        {!activeUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <span className="text-5xl mb-4">💬</span>
            <p className="text-zinc-400 font-arabic text-lg font-bold">اختار محادثة</p>
            <p className="text-zinc-600 text-sm mt-1">أو ابحث عن صاحب للمراسلة</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md">
              <button onClick={() => { setActiveUserId(null); navigate('/messages'); }}
                className="md:hidden text-zinc-400 hover:text-white p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15,18 9,12 15,6"/>
                </svg>
              </button>
              {activeUser && (
                <>
                  <div className="relative">
                    <Avatar user={activeUser} size="sm" />
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${activeUser.isOnline ? 'bg-green-500' : 'bg-zinc-600'}`} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">@{activeUser.username}</p>
                    <p className="text-xs text-zinc-500">
                      {typing ? (
                        <span className="text-orange-400 animate-pulse">يكتب...</span>
                      ) : activeUser.isOnline ? (
                        <span className="text-green-400">متصل الآن</span>
                      ) : (
                        `آخر ظهور: ${formatDistanceToNow(new Date(activeUser.lastSeen || Date.now()), { addSuffix: true, locale: ar })}`
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingMsgs ? (
                <div className="flex justify-center items-center h-full">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <span className="text-4xl mb-3">👋</span>
                  <p className="text-zinc-500 font-arabic">ابدأ المحادثة!</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg._id} className={`flex ${isMine(msg) ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                    <div className={`${isMine(msg) ? 'bubble-sent' : 'bubble-received'} ${msg.optimistic ? 'opacity-70' : ''}`}>
                      <p className="text-sm font-arabic break-words">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMine(msg) ? 'text-orange-200' : 'text-zinc-500'}`}>
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: ar })}
                        {msg.optimistic && ' · ✓'}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-zinc-800 flex gap-2">
              <input
                ref={inputRef}
                value={text}
                onChange={e => { setText(e.target.value); handleTyping(); }}
                placeholder="أكتب رسالة..."
                className="input-field py-2.5 text-sm flex-1"
                maxLength={1000}
                dir="auto"
              />
              <button
                type="submit"
                disabled={!text.trim() || sending}
                className="btn-primary px-4 py-2.5 flex-shrink-0"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/>
                </svg>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
