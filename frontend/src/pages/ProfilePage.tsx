import { useParams, Link } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.tsx'
import PostCard from '../components/PostCard.tsx'
import CreatePostBox from '../components/CreatePostBox.tsx'
import {
  postApi,
  friendshipApi,
  userApi,
  reactionApi,
  commentApi,
  getErrorMessage,
  type User,
  type Post,
  type ReactType
} from '../services/api'

type Tab = 'posts' | 'friends' | 'photos' | 'about'

interface EditModalProps {
  user: User
  onClose: () => void
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}

function EditModal({ user, onClose, onSuccess, onError: _onError }: EditModalProps) {
  const [form, setForm] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone_number: user.phone_number ?? '',
    date_of_birth: user.date_of_birth ?? '',
    gender: user.gender,
  })
  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.first_name.trim()) { setValidationError('First name is required.'); return }
    if (!form.last_name.trim()) { setValidationError('Last name is required.'); return }
    setValidationError(null)
    setLoading(true)
    try {
      await userApi.update(user.user_id, {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone_number: form.phone_number || undefined,
        date_of_birth: form.date_of_birth || undefined,
        gender: form.gender as any,
      })
      onSuccess('Profile updated successfully.')
      onClose()
    } catch (err: any) {
      setValidationError(err.message || 'Update failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-fb-blue px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Chỉnh sửa trang cá nhân</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {validationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{validationError}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-fb-text-2 mb-1">Họ</label>
              <input type="text" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-fb-text-2 mb-1">Tên</label>
              <input type="text" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-fb-text-2 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-fb-text-2 mb-1">Số điện thoại</label>
            <input type="tel" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
              className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-fb-text-2 mb-1">Ngày sinh</label>
              <input type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-fb-text-2 mb-1">Giới tính</label>
              <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as any }))}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue bg-white">
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
                <option value="UNSPECIFIED">Không xác định</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary" disabled={loading}>Hủy</button>
            <button type="submit" className="flex-1 btn-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const { user: me } = useAuth()
  
  // Convert userId to number, handle "me" keyword
  const getUid = () => {
    if (userId === 'me') return me?.user_id || null
    const n = Number(userId)
    return isNaN(n) ? null : n
  }
  const uid = getUid()
  const isMe = !!(me && uid === me.user_id)

  const [targetUser, setTargetUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'friends'>('none')
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('posts')
  const [friends, setFriends] = useState<User[]>([])
  const [reactions, setReactions] = useState<{ post_id: number; user_id: number; react_type: ReactType }[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [toastKey, setToastKey] = useState(0)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setToastKey(k => k + 1)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast, toastKey])

  const fetchData = useCallback(async (targetId: number) => {
    console.log(`[ProfilePage] fetchData started for uid: ${targetId}`)
    setLoading(true)
    try {
      // Set a safety timeout for the entire data fetch
      const timeoutId = setTimeout(() => {
        console.warn(`[ProfilePage] fetchData taking too long for uid: ${targetId}`)
        setLoading(false)
      }, 8000)

      console.log(`[ProfilePage] Fetching target user ${targetId}...`)
      const uRes = await userApi.getOne(targetId)
      const userToDisplay = uRes.data
      console.log(`[ProfilePage] Target user fetched:`, userToDisplay?.email)
      
      setTargetUser(userToDisplay)

      if (!userToDisplay) {
        console.warn(`[ProfilePage] User not found: ${targetId}`)
        clearTimeout(timeoutId)
        setLoading(false)
        return
      }

      console.log(`[ProfilePage] Fetching parallel data (posts, friends, reactions)...`)
      const [postsRes, friendshipRes, reactionsRes] = await Promise.allSettled([
        postApi.list({ limit: 50, user_id: targetId }),
        friendshipApi.getFriendshipData(),
        reactionApi.list()
      ])
      console.log(`[ProfilePage] Parallel data fetch results:`, {
        posts: postsRes.status,
        friends: friendshipRes.status,
        reactions: reactionsRes.status
      })

      if (postsRes.status === 'fulfilled') {
        const items = Array.isArray(postsRes.value.data) ? postsRes.value.data : []
        setPosts([...items].sort((a, b) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        ))
      }

      if (reactionsRes.status === 'fulfilled') {
        setReactions(Array.isArray(reactionsRes.value.data) ? reactionsRes.value.data : [])
      }

      if (friendshipRes.status === 'fulfilled') {
        const fData = friendshipRes.value.data
        const friendsList = fData?.friends || []
        const sentRequests = fData?.sent_requests || []
        const receivedRequests = fData?.received_requests || []

        if (targetId === me?.user_id) {
          setFriends(friendsList)
          setFriendStatus('none')
        } else {
          const isFriendWithProfile = friendsList.some(f => f?.user_id === targetId)
          const sentRequestTo = sentRequests.some(r => r?.user_id === targetId)
          const receivedRequestFrom = receivedRequests.some(r => r?.user_id === targetId)
          
          if (isFriendWithProfile) setFriendStatus('friends')
          else if (sentRequestTo || receivedRequestFrom) setFriendStatus('pending')
          else setFriendStatus('none')
          setFriends([]) 
        }
      }
      clearTimeout(timeoutId)
    } catch (err) {
      console.error('[ProfilePage] Critical failure in fetchData:', err)
    } finally {
      console.log(`[ProfilePage] fetchData finished for uid: ${targetId}`)
      setLoading(false)
    }
  }, [me?.user_id])

  useEffect(() => {
    if (uid) {
      fetchData(uid!)
    } else if (userId !== 'me') {
      setLoading(false)
    }
    // If it's 'me' and uid is null, we wait for 'me' to be loaded via AuthContext
  }, [uid, fetchData, userId])

  useEffect(() => {
    if (expandedPostId === null) return
    async function fetchComments() {
      try {
        const res = await commentApi.list(expandedPostId!)
        setComments(prev => {
          const without = prev.filter(c => c.post_id !== expandedPostId)
          return [...without, ...res.data]
        })
      } catch (err) { console.error('Failed to fetch comments:', err) }
    }
    fetchComments()
  }, [expandedPostId])

  async function handleSendFriendRequest() {
    if (!me || isMe || uid === null) return
    setActionLoading(true)
    try {
      await friendshipApi.sendRequest(uid!)
      setFriendStatus('pending')
      showToast('Đã gửi lời mời kết bạn.', 'success')
    } catch (err) { showToast(getErrorMessage(err), 'error') }
    finally { setActionLoading(false) }
  }

  async function handleUnfriend() {
    if (!me || uid === null) return
    setActionLoading(true)
    try {
      await friendshipApi.unfriend(uid!)
      setFriendStatus('none')
      setFriends(prev => prev.filter(f => f.user_id !== uid))
      showToast('Đã hủy kết bạn.', 'success')
    } catch (err) { showToast(getErrorMessage(err), 'error') }
    finally { setActionLoading(false) }
  }

  async function handlePost({ content, visibility }: { content: string; visibility: string }) {
    try {
      const response = await postApi.create({ content, visibility })
      setPosts(ps => [response.data, ...ps])
    } catch (err) {
      console.error('Failed to create post:', err)
      showToast(getErrorMessage(err), 'error')
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
          setReactions(prev => prev.map(r => r.post_id === postId && r.user_id === userId ? { ...r, react_type: type } : r))
        }
      } else {
        await reactionApi.react(postId, type)
        setReactions(prev => [...prev, { post_id: postId, user_id: userId, react_type: type }])
      }
    } catch (err) { console.error('Failed to react:', err) }
  }

  async function handleComment(postId: number, content: string, _userId: number) {
    try {
      const res = await commentApi.create(postId, content)
      setComments(prev => [...prev, res.data])
    } catch (err) { showToast(getErrorMessage(err), 'error') }
  }

  async function handleShare(postId: number) {
    try {
      await postApi.share(postId)
      showToast('Bài viết đã được chia sẻ!', 'success')
    } catch (err) { showToast(getErrorMessage(err), 'error') }
  }

  const handleToggleComments = useCallback((postId: number) => {
    setExpandedPostId(prev => prev === postId ? null : postId)
  }, [])

  const GENDER_LABELS: Record<string, string> = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' }

  // ── Invalid user ID ──────────────────────────────────────────────────────────
  if (uid === null) {
    return <div className="text-center py-20 text-fb-text-2">ID người dùng không hợp lệ.</div>
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-fb-blue border-t-transparent rounded-full"/>
      </div>
    )
  }

  // ── User not found ───────────────────────────────────────────────────────────
  if (!targetUser) {
    return (
      <div className="text-center py-20">
        <p className="text-fb-text-2 text-lg">Không tìm thấy người dùng.</p>
      </div>
    )
  }

  const fullName = targetUser.first_name && targetUser.last_name
    ? `${targetUser.first_name} ${targetUser.last_name}`
    : (targetUser.email ? targetUser.email.split('@')[0] : `User ${targetUser.user_id}`)
  
  const avatarUrl = targetUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=1877F2&color=fff`
  const coverUrl = targetUser.cover_page_url || null
  const TABS: { key: Tab; label: string }[] = [
    { key: 'posts', label: 'Bài viết' },
    { key: 'friends', label: 'Bạn bè' },
    { key: 'photos', label: 'Ảnh' },
    { key: 'about', label: 'Giới thiệu' },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white ${toast.type === 'success' ? 'bg-fb-green' : 'bg-red-500'}`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
        </div>
      )}

      {showEditModal && me && (
        <EditModal
          user={me}
          onClose={() => setShowEditModal(false)}
          onSuccess={msg => { showToast(msg, 'success'); window.location.reload() }}
          onError={msg => showToast(msg, 'error')}
        />
      )}

      <div className="card overflow-hidden mb-4">
        {coverUrl ? (
          <img src={coverUrl} className="w-full h-48 lg:h-64 object-cover" alt="Bìa" />
        ) : (
          <div className="h-48 lg:h-64 bg-gradient-to-br from-fb-blue to-purple-600 relative" />
        )}
        <div className="px-4 pb-4 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-16">
            <img src={avatarUrl} alt={fullName} className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-white shadow" />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    {fullName}
                    {targetUser.is_verified && <span title="Đã xác minh" className="text-fb-blue text-lg">✔️</span>}
                  </h1>
                  <p className="text-fb-text-2 text-sm">{friends.length} bạn bè</p>
                </div>
                <div className="flex gap-2 mt-auto">
                  {isMe ? (
                    <button onClick={() => setShowEditModal(true)} className="btn-secondary text-sm px-4 py-2">✏️ Chỉnh sửa</button>
                  ) : friendStatus === 'friends' ? (
                    <button onClick={handleUnfriend} disabled={actionLoading} className="btn-secondary text-sm px-4 py-2">👥 Bạn bè</button>
                  ) : friendStatus === 'pending' ? (
                    <button disabled className="btn-secondary text-sm px-4 py-2 opacity-60">⏳ Đã gửi</button>
                  ) : (
                    <button onClick={handleSendFriendRequest} disabled={actionLoading} className="btn-primary text-sm px-4 py-2">+ Thêm bạn bè</button>
                  )}
                  {!isMe && (
                    <button className="btn-secondary text-sm px-4 py-2">💬 Nhắn tin</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex border-t border-fb-gray-2 px-4">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors
                ${activeTab === tab.key ? 'border-fb-blue text-fb-blue' : 'border-transparent text-fb-text-2 hover:bg-fb-gray-2 rounded-lg'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="hidden lg:block w-64 flex-shrink-0 space-y-4">
          <div className="card p-4 space-y-3">
            <h3 className="font-bold">Giới thiệu</h3>
            <InfoRow icon="👥" label={`${friends.length} bạn bè`} />
            {targetUser.gender && targetUser.gender !== 'UNSPECIFIED' && (
              <InfoRow icon="🏷️" label={GENDER_LABELS[targetUser.gender] ?? ''} />
            )}
            {targetUser.is_admin && <InfoRow icon="🛡️" label="Quản trị viên" />}
          </div>
          {friends.length > 0 && (
            <div className="card p-4">
              <div className="flex justify-between mb-3">
                <h3 className="font-bold">Bạn bè</h3>
                <button onClick={() => setActiveTab('friends')} className="text-fb-blue text-sm hover:underline">Xem tất cả</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {friends.slice(0, 9).map(f => (
                  <Link key={f.user_id} to={`/profile/${f.user_id}`}>
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent((f.first_name || '') + ' ' + (f.last_name || ''))}&background=1877F2&color=fff`}
                      className="w-full aspect-square rounded-lg object-cover"
                    />
                    <p className="text-xs mt-1 text-center truncate">
                      {f.first_name && f.last_name ? f.first_name : (f.email ? f.email.split('@')[0] : `User ${f.user_id}`)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          {activeTab === 'posts' && (
            <>
              {isMe && me && <CreatePostBox onPost={handlePost} />}
              {loading ? (
                <div className="card p-8 text-center text-fb-text-2 text-sm">Đang tải bài viết...</div>
              ) : posts.length === 0 ? (
                <div className="card p-8 text-center text-fb-text-2 text-sm">Chưa có bài viết nào.</div>
              ) : (
                posts.map(p => (
                  <PostCard
                    key={p.post_id}
                    post={p}
                    reactions={reactions.filter(r => r.post_id === p.post_id)}
                    comments={comments.filter(c => c.post_id === p.post_id)}
                    onReact={handleReact}
                    onComment={handleComment}
                    onShare={handleShare}
                    onToggleComments={handleToggleComments}
                    commentsExpanded={expandedPostId === p.post_id}
                  />
                ))
              )}
            </>
          )}

          {activeTab === 'friends' && (
            <div className="card p-4">
              <h3 className="font-bold text-lg mb-4">{friends.length} bạn bè</h3>
              {friends.length === 0 ? (
                <p className="text-fb-text-2 text-sm">Chưa có bạn bè nào.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {friends.map(f => (
                    <Link key={f.user_id} to={`/profile/${f.user_id}`} className="hover:opacity-80 transition-opacity">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent((f.first_name || '') + ' ' + (f.last_name || ''))}&background=1877F2&color=fff`}
                        className="w-full aspect-square rounded-lg object-cover"
                      />
                      <p className="font-semibold text-sm mt-2 truncate">
                        {f.first_name && f.last_name ? `${f.first_name} ${f.last_name}` : (f.email ? f.email.split('@')[0] : `User ${f.user_id}`)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="card p-4">
              <h3 className="font-bold text-lg mb-4">Ảnh</h3>
              <p className="text-fb-text-2 text-sm">Chưa có ảnh nào.</p>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="card p-4">
              <h3 className="font-bold text-lg mb-4">Giới thiệu</h3>
              <div className="space-y-3">
                <InfoRow icon="👥" label={`${friends.length} bạn bè`} />
                {targetUser.gender && targetUser.gender !== 'UNSPECIFIED' && (
                  <InfoRow icon="🏷️" label={`Giới tính: ${GENDER_LABELS[targetUser.gender] || targetUser.gender}`} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


function InfoRow({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-fb-text-2">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  )
}

