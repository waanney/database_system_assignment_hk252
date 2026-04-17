import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.tsx'
import PostCard from '../components/PostCard.tsx'
import CreatePostBox from '../components/CreatePostBox.tsx'
import {
  POSTS, REACTIONS, COMMENTS,
  getFriends,
  type Post, type Reaction, type Comment, type Visibility, type ReactType,
} from '../data/mockData.ts'
import { postApi, reactionApi, commentApi, getErrorMessage } from '../services/api'

export default function NewsFeedPage() {
  const { user } = useAuth()
  const friendIds = getFriends(user?.user_id ?? 0)

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [reactions, setReactions] = useState<Reaction[]>([...REACTIONS])
  const [comments, setComments] = useState<Comment[]>([...COMMENTS])
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // Fetch posts from API on mount
  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await postApi.list({ limit: 50 })
        const filteredPosts = response.data.filter(p =>
          p.visibility === 'PUBLIC' ||
          p.user_id === user?.user_id ||
          friendIds.includes(p.user_id)
        )
        setPosts(filteredPosts.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ))
      } catch (err) {
        console.error('Failed to fetch posts:', err)
        setPosts([...POSTS].filter(p =>
          p.visibility === 'PUBLIC' ||
          p.user_id === user?.user_id ||
          friendIds.includes(p.user_id)
        ).sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ))
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [user?.user_id, friendIds.join(',')])

  // Fetch comments when a post's comment section is expanded
  useEffect(() => {
    if (expandedPostId === null) return
    async function fetchComments() {
      try {
        const res = await commentApi.list(expandedPostId)
        setComments(prev => {
          const withoutExpanded = prev.filter(c => c.post_id !== expandedPostId)
          return [...withoutExpanded, ...res.data]
        })
      } catch (err) {
        console.error('Failed to fetch comments:', err)
      }
    }
    fetchComments()
  }, [expandedPostId])

  async function handlePost({ content, visibility, user_id }: { content: string; visibility: Visibility; user_id: number }) {
    try {
      const response = await postApi.create({ content, visibility })
      const newPost: Post = response.data
      setPosts(ps => [newPost, ...ps])
    } catch (err) {
      console.error('Failed to create post:', err)
      const newPost: Post = {
        post_id: Date.now(),
        user_id,
        content,
        visibility,
        created_at: new Date().toISOString(),
      }
      setPosts(ps => [newPost, ...ps])
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
    } catch (err) {
      console.error('Failed to react:', err)
    }
  }

  async function handleComment(postId: number, content: string, userId: number) {
    try {
      const res = await commentApi.create(postId, content)
      setComments(prev => [...prev, res.data])
    } catch (err) {
      setToast(getErrorMessage(err))
    }
  }

  async function handleShare(postId: number) {
    try {
      await postApi.share(postId)
      setToast('Bai viet da duoc chia se!')
    } catch (err) {
      setToast(getErrorMessage(err))
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
      {loading ? (
        <div className="card p-8 text-center text-fb-text-2">Dang tai bai viet...</div>
      ) : enrichedPosts.length === 0 ? (
        <div className="card p-8 text-center text-fb-text-2">Chua co bai viet nao.</div>
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

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg bg-fb-green text-white font-medium">
          {toast}
          <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 text-lg leading-none">
            &times;
          </button>
        </div>
      )}
    </div>
  )
}
