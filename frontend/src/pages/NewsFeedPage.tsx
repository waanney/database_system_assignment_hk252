import { useState } from 'react'
import { useAuth } from '../context/AuthContext.tsx'
import PostCard from '../components/PostCard.tsx'
import CreatePostBox from '../components/CreatePostBox.tsx'
import {
  POSTS, REACTIONS, COMMENTS,
  getFriends,
  type Post, type Reaction, type Comment, type Visibility, type ReactType,
} from '../data/mockData.ts'

export default function NewsFeedPage() {
  const { user } = useAuth()
  const friendIds = getFriends(user?.user_id ?? 0)

  const [posts, setPosts] = useState<Post[]>(() =>
    [...POSTS]
      .filter(p =>
        p.visibility === 'PUBLIC' ||
        p.user_id === user?.user_id ||
        friendIds.includes(p.user_id)
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  )
  const [reactions, setReactions] = useState<Reaction[]>([...REACTIONS])
  const [comments,  setComments]  = useState<Comment[]>([...COMMENTS])

  function handlePost({ content, visibility, user_id }: { content: string; visibility: Visibility; user_id: number }) {
    const newPost: Post = {
      post_id:    Date.now(),
      user_id,
      content,
      visibility,
      created_at: new Date().toISOString(),
    }
    setPosts(ps => [newPost, ...ps])
  }

  function handleReact(postId: number, type: ReactType, userId: number) {
    setReactions(prev => {
      const exists = prev.find(r => r.post_id === postId && r.user_id === userId)
      if (exists) {
        if (exists.react_type === type) {
          return prev.filter(r => !(r.post_id === postId && r.user_id === userId))
        }
        return prev.map(r =>
          r.post_id === postId && r.user_id === userId ? { ...r, react_type: type } : r
        )
      }
      return [...prev, { post_id: postId, user_id: userId, react_type: type }]
    })
  }

  function handleComment(postId: number, content: string, userId: number) {
    const newComment: Comment = {
      comment_id: Date.now(),
      user_id:    userId,
      post_id:    postId,
      content,
      created_at: new Date().toISOString(),
    }
    setComments(prev => [...prev, newComment])
  }

  const enrichedPosts = posts.map(p => ({
    ...p,
    _reactions: reactions.filter(r => r.post_id === p.post_id),
    _comments:  comments.filter(c => c.post_id === p.post_id),
  }))

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <CreatePostBox onPost={handlePost} />
      {enrichedPosts.map(post => (
        <PostCard
          key={post.post_id}
          post={post}
          onReact={handleReact}
          onComment={handleComment}
        />
      ))}
    </div>
  )
}
