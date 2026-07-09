'use client';

import React, { useState, useEffect } from 'react';
import { getPosts, createPost, createComment, getPostWithComments, likePost } from '@/app/actions/communityActions';
import { useSession } from 'next-auth/react';
import { Loader2, MessageCircle, Heart, PlusCircle, Pin, ArrowLeft, Send } from 'lucide-react';

export default function CommunityPage() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Single Post View State
  const [activePost, setActivePost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');

  const loadPosts = async () => {
    setLoading(true);
    const res = await getPosts(1, 20, category);
    if (res.success) setPosts(res.posts);
    setLoading(false);
  };

  const handleLikePost = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (status !== 'authenticated') return alert('Must be logged in to like posts.');
    
    const userId = (session?.user as any)?.id;
    
    // Optimistic Update
    setPosts(prev => prev.map(p => {
      if (p._id === postId) {
        const hasLiked = p.likedBy && p.likedBy.includes(userId);
        const newLikedBy = hasLiked
          ? p.likedBy.filter((id: string) => id !== userId)
          : [...(p.likedBy || []), userId];
        return {
          ...p,
          likedBy: newLikedBy,
          likesCount: hasLiked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1
        };
      }
      return p;
    }));

    if (activePost && activePost._id === postId) {
      setActivePost((prev: any) => {
        if (!prev) return null;
        const hasLiked = prev.likedBy && prev.likedBy.includes(userId);
        const newLikedBy = hasLiked
          ? prev.likedBy.filter((id: string) => id !== userId)
          : [...(prev.likedBy || []), userId];
        return {
          ...prev,
          likedBy: newLikedBy,
          likesCount: hasLiked ? Math.max(0, prev.likesCount - 1) : prev.likesCount + 1
        };
      });
    }

    const res = await likePost(postId);
    if (res.success) {
      if (activePost && activePost._id === postId) {
        loadSinglePost(postId);
      } else {
        const freshPosts = await getPosts(1, 20, category);
        if (freshPosts.success) setPosts(freshPosts.posts);
      }
    }
  };

  useEffect(() => {
    if (!activePost) {
      loadPosts();
    }
  }, [category, activePost]);

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status !== 'authenticated') return alert('Must be logged in to post.');
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const res = await createPost(formData);
    if (res.success) {
      setIsCreating(false);
      loadPosts();
    } else {
      alert(res.error);
    }
    setSubmitting(false);
  };

  const loadSinglePost = async (postId: string) => {
    setLoading(true);
    const res = await getPostWithComments(postId);
    if (res.success) {
      setActivePost(res.post);
      setComments(res.comments);
    }
    setLoading(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    const res = await createComment(activePost._id, commentText);
    if (res.success) {
      setCommentText('');
      loadSinglePost(activePost._id);
    }
    setSubmitting(false);
  };

  if (activePost) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button 
          onClick={() => setActivePost(null)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Discussions
        </button>

        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 uppercase">
                  {activePost.category}
                </span>
                <span className="text-sm text-muted-foreground">{new Date(activePost.createdAt).toLocaleDateString()}</span>
              </div>
              <h1 className="text-2xl font-bold font-outfit mb-4">{activePost.title}</h1>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{activePost.content}</p>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Posted by <span className="font-semibold text-slate-900 dark:text-white">{activePost.userId?.name || 'Anonymous'}</span>
                </span>
                
                <button
                  onClick={(e) => handleLikePost(e, activePost._id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    activePost.likedBy?.includes((session?.user as any)?.id)
                      ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-450'
                      : 'hover:bg-slate-50 border-slate-200 text-muted-foreground'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${activePost.likedBy?.includes((session?.user as any)?.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>Upvote ({activePost.likesCount || 0})</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold font-outfit text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5" /> Comments ({comments.length})
              </h3>
              
              {comments.map((c, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-sm">{c.userId?.name || 'Anonymous'}</span>
                    <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{c.content}</p>
                </div>
              ))}

              {status === 'authenticated' ? (
                <form onSubmit={handleAddComment} className="flex gap-2 mt-4">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700"
                    required
                  />
                  <button 
                    disabled={submitting}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground mt-4">Log in to post a comment.</p>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold font-outfit text-slate-900 dark:text-white">Community Forum</h1>
          <p className="text-muted-foreground">Ask questions, share reflections, and support each other.</p>
        </div>
        {status === 'authenticated' && (
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" /> {isCreating ? 'Cancel' : 'New Post'}
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={handleCreatePost} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900 space-y-4">
          <h2 className="text-xl font-bold font-outfit">Create a Post</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input name="title" required minLength={5} className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700" placeholder="What's on your mind?" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select name="category" className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700">
              <option value="general">General</option>
              <option value="question">Question</option>
              <option value="reflection">Reflection</option>
              <option value="support">Support</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea name="content" required minLength={10} rows={4} className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700" placeholder="Elaborate here..." />
          </div>
          <button disabled={submitting} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Post Discussion
          </button>
        </form>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'general', 'question', 'reflection', 'support'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${
              category === cat 
                ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <div 
              key={post._id} 
              onClick={() => loadSinglePost(post._id)}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-emerald-200 dark:hover:border-emerald-800/50 transition cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {post.isPinned && <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />}
                  <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 uppercase">
                    {post.category}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <h2 className="text-lg font-bold font-outfit mb-1">{post.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">{post.content}</p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">By {post.userId?.name || 'Anonymous'}</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => handleLikePost(e, post._id)}
                    className={`flex items-center gap-1 hover:text-rose-500 transition cursor-pointer ${
                      post.likedBy?.includes((session?.user as any)?.id) ? 'text-rose-500 font-semibold' : ''
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${post.likedBy?.includes((session?.user as any)?.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{post.likesCount || 0}</span>
                  </button>
                  <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {post.commentsCount}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
            <MessageCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No discussions found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
