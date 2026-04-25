import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.tsx'
import PostCard from '../components/PostCard.tsx'
import CreatePostBox from '../components/CreatePostBox.tsx'
import { postApi, reactionApi, commentApi, friendshipApi, type Post, type ReactType } from '../services/api'

type Visibility = 'PUBLIC' | 'FRIENDS' | 'PRIVATE' | 'CUSTOM'

export default function NewsFeedPage() {
  const { user } = useAuth()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [reactions, setReactions] = useState<{ post_id: number; user_id: number; react_type: ReactType }[]>([])
  const [comments, setComments] = useState<{ comment_id: number; post_id: number; user_id: number; content: string; created_at: string; parent_comment_id?: number | null }[]>([])
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  // Fetch posts and friend IDs on mount
  useEffect(() => {
    if (!user) return

    async function fetchData() {
      setLoading(true)
      try {
        const [postsRes, friendshipRes] = await Promise.all([
          postApi.list({ limit: 50 }),
          friendshipApi.getFriendshipData(),
        ])

        const friendIds = friendshipRes.data.friends.map((f: { user_id: number }) => f.user_id)

        const visible = postsRes.data.filter(p =>
          !p.group_id &&
          (p.visibility === 'PUBLIC' ||
          p.user_id === (user?.user_id ?? -1) ||
          friendIds.includes(p.user_id))
        )

        setPosts(visible.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ))
        setReactions([])
        setComments([])
      } catch (err) {
        console.error('Failed to fetch posts:', err)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.user_id])

  // Fetch comments when a post's comment section is expanded
  useEffect(() => {
    if (expandedPostId === null) return
    const epId = expandedPostId

    async function fetchComments() {
      try {
        const res = await commentApi.list(epId)
        setComments(prev => {
          const without = prev.filter(c => c.post_id !== epId)
          return [...without, ...res.data]
        })
      } catch (err) {
        console.error('Failed to fetch comments:', err)
      }
    }
    fetchComments()
  }, [expandedPostId])

  async function handlePost({ content, visibility }: { content: string; visibility: Visibility; user_id: number }) {
    try {
      const response = await postApi.create({ content, visibility })
      const newPost: Post = response.data
      setPosts(ps => [newPost, ...ps])
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to create post.', type: 'error' })
    }
  }

  async function handleReact(postId: number, type: ReactType, userId: number) {
    const existing = reactions.find(r => r.post_id === postId && r.user_id === userId)
    try {
      if (existing) {
        if (existing.react_type === type) {
          await reactionApi.unreact(postId)
          setReactions(prev => prev.filter(r => !(r.post_id === postId && r.user_id === userId)))
        } else {
          await reactionApi.react(postId, type)
          setReactions(prev => prev.map(r =>
            r.post_id === postId && r.user_id === userId ? { ...r, react_type: type } : r
          ))
        }
      } else {
        await reactionApi.react(postId, type)
        setReactions(prev => [...prev, { post_id: postId, user_id: userId, react_type: type }])
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to react.', type: 'error' })
    }
  }

  async function handleComment(postId: number, content: string, _userId: number, parentCommentId?: number) {
    const tempId = -Date.now()
    const optimistic: { comment_id: number; post_id: number; user_id: number; content: string; created_at: string; parent_comment_id?: number | null } = {
      comment_id: tempId, post_id: postId, user_id: _userId,
      content, created_at: new Date().toISOString(),
      parent_comment_id: parentCommentId ?? null,
    }
    setComments(prev => [...prev, optimistic])
    try {
      const res = await commentApi.create(postId, content, parentCommentId)
      setComments(prev => prev.map(c => c.comment_id === tempId ? res.data : c))
    } catch (err: any) {
      setComments(prev => prev.filter(c => c.comment_id !== tempId))
      setToast({ message: err.message || 'Failed to comment.', type: 'error' })
    }
  }

  async function handleShare(postId: number) {
    try {
      await postApi.share(postId)
      setToast({ message: 'Post shared successfully.', type: 'success' })
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to share post.', type: 'error' })
    }
  }

  const handleToggleComments = useCallback((postId: number) => {
    setExpandedPostId(prev => prev === postId ? null : postId)
  }, [])

  const enrichedPosts = posts.map(p => ({
    ...p,
    _reactions: reactions.filter(r => r.post_id === p.post_id),
    _comments: comments.filter(c => c.post_id === p.post_id),
  }))

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <CreatePostBox onPost={handlePost} />

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white ${toast.type === 'success' ? 'bg-fb-green' : 'bg-red-500'}`}>
          <span>{toast.type === 'success' ? '\u2713' : '\u2715'}</span>
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-fb-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : enrichedPosts.length === 0 ? (
        <div className="card p-8 text-center text-fb-text-2 text-sm">No posts to show.</div>
      ) : (
        enrichedPosts.map(post => (
          <PostCard
            key={post.post_id}
            post={post}
            reactions={post._reactions}
            comments={post._comments}
            onReact={handleReact}
            onComment={handleComment}
            onShare={handleShare}
            onToggleComments={handleToggleComments}
            commentsExpanded={expandedPostId === post.post_id}
          />
        ))
      )}
    </div>
  )
}
