import { useState, type SVGProps, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import {
  getAvatar, getFullName,
  getPostReactions, getPostComments,
  type Post, type ReactType,
} from '../data/mockData.ts'

const REACTION_EMOJIS: Record<ReactType, string> = {
  LIKE: '👍', LOVE: '❤️', HAHA: '😆', WOW: '😮', CARE: '🥰', SAD: '😢', ANGRY: '😡',
}

const VISIBILITY_ICONS: Record<string, string> = {
  PUBLIC: '🌐', FRIENDS: '👥', PRIVATE: '🔒', CUSTOM: '⚙️',
}

interface PostCardProps {
  post:       Post
  onReact?:   (postId: number, type: ReactType, userId: number) => void
  onComment?: (postId: number, content: string, userId: number) => void
}

export default function PostCard({ post, onReact, onComment }: PostCardProps) {
  const { user } = useAuth()
  const [showComments,      setShowComments]      = useState(false)
  const [commentText,       setCommentText]        = useState('')
  const [showReactionPicker, setShowReactionPicker] = useState(false)

  const reactions  = post._reactions ?? getPostReactions(post.post_id)
  const comments   = post._comments  ?? getPostComments(post.post_id)
  const myReaction = reactions.find(r => r.user_id === user?.user_id)

  const reactionCounts = reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.react_type] = (acc[r.react_type] ?? 0) + 1
    return acc
  }, {})
  const topReactions = (Object.entries(reactionCounts) as [ReactType, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  function handleReact(type: ReactType) {
    setShowReactionPicker(false)
    if (user) onReact?.(post.post_id, type, user.user_id)
  }

  function handleComment(e: FormEvent) {
    e.preventDefault()
    if (!commentText.trim() || !user) return
    onComment?.(post.post_id, commentText.trim(), user.user_id)
    setCommentText('')
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <Link to={`/profile/${post.user_id}`}>
          <img src={getAvatar(post.user_id)} className="w-10 h-10 rounded-full object-cover" />
        </Link>
        <div>
          <Link to={`/profile/${post.user_id}`} className="font-semibold text-sm hover:underline">
            {getFullName(post.user_id)}
          </Link>
          <div className="flex items-center gap-1 text-xs text-fb-text-2">
            <span>{formatTimeAgo(post.created_at)}</span>
            <span>·</span>
            <span title={post.visibility}>{VISIBILITY_ICONS[post.visibility] ?? '🌐'}</span>
          </div>
        </div>
        <button className="ml-auto icon-btn">
          <DotsIcon className="w-5 h-5 text-fb-text-2" />
        </button>
      </div>

      {/* Content */}
      {post.content && <p className="px-4 pb-3 text-sm whitespace-pre-wrap">{post.content}</p>}
      {post.image_url && <img src={post.image_url} alt="" className="w-full object-cover max-h-96" />}

      {/* Reaction summary */}
      {reactions.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 text-fb-text-2 text-sm border-b border-fb-gray-2">
          <div className="flex items-center gap-1">
            <span className="flex">
              {topReactions.map(([type]) => (
                <span key={type} className="text-base -ml-1 first:ml-0">{REACTION_EMOJIS[type]}</span>
              ))}
            </span>
            <span>{reactions.length}</span>
          </div>
          {comments.length > 0 && (
            <button onClick={() => setShowComments(s => !s)} className="hover:underline">
              {comments.length} bình luận
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex border-b border-fb-gray-2">
        {/* Like / Reaction */}
        <div className="relative flex-1">
          <button
            onMouseEnter={() => setShowReactionPicker(true)}
            onMouseLeave={() => setShowReactionPicker(false)}
            onClick={() => handleReact(myReaction?.react_type ?? 'LIKE')}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-fb-gray-2 transition-colors text-sm font-semibold
              ${myReaction ? 'text-fb-blue' : 'text-fb-text-2'}`}
          >
            <span className="text-base">{myReaction ? REACTION_EMOJIS[myReaction.react_type] : '👍'}</span>
            <span>{myReaction ? myReaction.react_type : 'Thích'}</span>
          </button>
          {showReactionPicker && (
            <div
              className="absolute bottom-full left-0 mb-1 flex gap-1 bg-white shadow-lg rounded-full px-3 py-2 z-10"
              onMouseEnter={() => setShowReactionPicker(true)}
              onMouseLeave={() => setShowReactionPicker(false)}
            >
              {(Object.entries(REACTION_EMOJIS) as [ReactType, string][]).map(([type, emoji]) => (
                <button key={type} onClick={() => handleReact(type)}
                  className="text-2xl hover:scale-125 transition-transform" title={type}>
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowComments(s => !s)}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-fb-gray-2 transition-colors text-fb-text-2 text-sm font-semibold"
        >
          <CommentIcon className="w-5 h-5" />
          <span>Bình luận</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-fb-gray-2 transition-colors text-fb-text-2 text-sm font-semibold">
          <ShareIcon className="w-5 h-5" />
          <span>Chia sẻ</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="px-4 pt-3 pb-4 space-y-3">
          {comments.map(c => (
            <div key={c.comment_id} className="flex items-start gap-2">
              <Link to={`/profile/${c.user_id}`}>
                <img src={getAvatar(c.user_id)} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
              </Link>
              <div className="bg-fb-gray rounded-2xl px-3 py-2">
                <Link to={`/profile/${c.user_id}`} className="font-semibold text-xs hover:underline block">
                  {getFullName(c.user_id)}
                </Link>
                <p className="text-sm">{c.content}</p>
              </div>
            </div>
          ))}
          <form onSubmit={handleComment} className="flex items-center gap-2">
            <img src={getAvatar(user?.user_id ?? 0)} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Viết bình luận..."
              className="flex-1 bg-fb-gray rounded-full px-4 py-2 text-sm outline-none"
            />
          </form>
        </div>
      )}
    </div>
  )
}

function formatTimeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)    return 'Vừa xong'
  if (diff < 3600)  return `${Math.floor(diff / 60)} phút`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`
  return `${Math.floor(diff / 86400)} ngày`
}

function DotsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  )
}
function CommentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
    </svg>
  )
}
function ShareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
    </svg>
  )
}
