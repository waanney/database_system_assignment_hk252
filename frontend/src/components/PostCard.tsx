import { useState, useEffect, useRef, type SVGProps, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { getAvatar, getFullName, type Post, type ReactType } from '../data/mockData.ts'
import { reportApi, getErrorMessage } from '../services/api.ts'

const REACTION_EMOJIS: Record<ReactType, string> = {
  LIKE: '👍', LOVE: '❤️', HAHA: '😆', WOW: '😮', CARE: '🥰', SAD: '😢', ANGRY: '😡',
}

const VISIBILITY_ICONS: Record<string, string> = {
  PUBLIC: '🌐', FRIENDS: '👥', PRIVATE: '🔒', CUSTOM: '⚙️',
}

interface PostCardProps {
  post: Post
  reactions?: { post_id: number; user_id: number; react_type: ReactType }[]
  comments?: { comment_id: number; post_id: number; user_id: number; content: string; created_at: string }[]
  onReact?: (postId: number, type: ReactType, userId: number) => void
  onComment?: (postId: number, content: string, userId: number) => void
  onShare?: (postId: number) => void
  onToggleComments?: (postId: number) => void
  /** Controls comments visibility from parent. When true, shows the comment section. */
  commentsExpanded?: boolean
}

export default function PostCard({
  post,
  reactions = [],
  comments = [],
  onReact,
  onComment,
  onShare,
  onToggleComments,
  commentsExpanded,
}: PostCardProps) {
  const { user } = useAuth()
  const [commentText, setCommentText] = useState('')
  const [showComments, setShowComments] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const reactionPickerTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMsg) return
    const t = setTimeout(() => setToastMsg(null), 3000)
    return () => clearTimeout(t)
  }, [toastMsg])

  const myReaction = reactions.find(r => r.user_id === user?.user_id)

  const reactionCounts = reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.react_type] = (acc[r.react_type] ?? 0) + 1
    return acc
  }, {})
  const topReactions = (Object.entries(reactionCounts) as [ReactType, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  function showPicker() {
    if (reactionPickerTimer.current) clearTimeout(reactionPickerTimer.current)
    setShowReactionPicker(true)
  }

  function hidePicker() {
    reactionPickerTimer.current = setTimeout(() => setShowReactionPicker(false), 200)
  }

  function cancelHide() {
    if (reactionPickerTimer.current) clearTimeout(reactionPickerTimer.current)
  }

  function handleReact(type: ReactType) {
    if (reactionPickerTimer.current) clearTimeout(reactionPickerTimer.current)
    setShowReactionPicker(false)
    if (user) onReact?.(post.post_id, type, user.user_id)
  }

  function handleComment(e: FormEvent) {
    e.preventDefault()
    if (!commentText.trim() || !user) return
    onComment?.(post.post_id, commentText.trim(), user.user_id)
    setCommentText('')
  }

  async function handleReport() {
    if (!user) return
    setReportLoading(true)
    try {
      await reportApi.submit(post.post_id, reportReason.trim() || undefined)
      setToastMsg('Bao cao da duoc gui. Cam on ban!')
      setShowReportModal(false)
      setReportReason('')
      setShowMenu(false)
    } catch (err) {
      setToastMsg(getErrorMessage(err))
    } finally {
      setReportLoading(false)
    }
  }

  return (
    <>
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

          {/* Dots menu */}
          <div className="relative ml-auto">
            <button onClick={() => setShowMenu(m => !m)} className="icon-btn">
              <DotsIcon className="w-5 h-5 text-fb-text-2" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-fb-gray-2 z-20 overflow-hidden">
                <button
                  onClick={() => { setShowMenu(false); setShowReportModal(true) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-fb-gray transition-colors"
                >
                  <span>🚩</span> Bao cao bai viet
                </button>
              </div>
            )}
          </div>
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
              <button
                onClick={() => onToggleComments ? onToggleComments(post.post_id) : setShowComments(s => !s)}
                className="hover:underline"
              >
                {comments.length} binh luan
              </button>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex border-b border-fb-gray-2">
          {/* Like / Reaction */}
          <div
            className="relative flex-1"
            onMouseEnter={showPicker}
            onMouseLeave={hidePicker}
          >
            <button
              onClick={() => handleReact(myReaction?.react_type ?? 'LIKE')}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-fb-gray-2 transition-colors text-sm font-semibold
                ${myReaction ? 'text-fb-blue' : 'text-fb-text-2'}`}
            >
              <span className="text-base">{myReaction ? REACTION_EMOJIS[myReaction.react_type] : '👍'}</span>
              <span>{myReaction ? myReaction.react_type : 'Thich'}</span>
            </button>
            {showReactionPicker && (
              <div
                className="absolute bottom-full left-0 mb-1 flex gap-1 bg-white shadow-lg rounded-full px-3 py-2 z-10 border border-fb-gray-2"
                onMouseEnter={cancelHide}
                onMouseLeave={hidePicker}
              >
                {(Object.entries(REACTION_EMOJIS) as [ReactType, string][]).map(([type, emoji]) => (
                  <button
                    key={type}
                    onClick={() => handleReact(type)}
                    className="text-2xl hover:scale-125 transition-transform"
                    title={type}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onToggleComments ? onToggleComments(post.post_id) : setShowComments(s => !s)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-fb-gray-2 transition-colors text-fb-text-2 text-sm font-semibold"
          >
            <CommentIcon className="w-5 h-5" />
            <span>Binh luan</span>
          </button>

          <button
            onClick={() => onShare?.(post.post_id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-fb-gray-2 transition-colors text-fb-text-2 text-sm font-semibold"
          >
            <ShareIcon className="w-5 h-5" />
            <span>Chia se</span>
          </button>
        </div>

        {/* Comments section */}
        {commentsExpanded && (
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
                placeholder="Viet binh luan..."
                className="flex-1 bg-fb-gray rounded-full px-4 py-2 text-sm outline-none"
              />
            </form>
          </div>
        )}
      </div>

      {/* Report modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-red-500 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-semibold text-lg">Bao cao bai viet</h2>
              <button onClick={() => setShowReportModal(false)} className="text-white/80 hover:text-white text-xl leading-none">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-fb-text-2">
                Ly do ban muon bao cao bai viet nay? (khong bat buoc)
              </p>
              <textarea
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                placeholder="Mo ta chi tiet..."
                rows={3}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fb-blue resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 btn-secondary"
                  disabled={reportLoading}
                >
                  Huy
                </button>
                <button
                  onClick={handleReport}
                  disabled={reportLoading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {reportLoading ? 'Dang gui...' : 'Gui bao cao'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg bg-fb-green text-white font-medium">
          {toastMsg}
          <button onClick={() => setToastMsg(null)} className="opacity-70 hover:opacity-100 text-lg leading-none">
            &times;
          </button>
        </div>
      )}
    </>
  )
}

function formatTimeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)    return 'Vua xong'
  if (diff < 3600)  return `${Math.floor(diff / 60)} phut`
  if (diff < 86400) return `${Math.floor(diff / 3600)} gio`
  return `${Math.floor(diff / 86400)} ngay`
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
