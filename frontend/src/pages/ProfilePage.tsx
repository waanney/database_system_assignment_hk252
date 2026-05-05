import { useParams, Link } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.tsx'
import PostCard from '../components/PostCard.tsx'
import CreatePostBox from '../components/CreatePostBox.tsx'
import { postApi, friendshipApi, userApi, reactionApi, commentApi, queryApi, type User, type Post, type Reaction, type ReactType } from '../services/api'

type Visibility = 'PUBLIC' | 'FRIENDS' | 'PRIVATE' | 'CUSTOM'

type Tab = 'posts' | 'friends' | 'photos' | 'about'

interface EditModalProps {
  user: User
  onClose: () => void
  onSuccess: (msg: string) => void
}

function EditModal({ user, onClose, onSuccess }: EditModalProps) {
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
          <h2 className="text-white font-semibold text-lg">Edit Profile</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {validationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{validationError}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-fb-text-2 mb-1">First Name</label>
              <input type="text" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-fb-text-2 mb-1">Last Name</label>
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
            <label className="block text-sm font-medium text-fb-text-2 mb-1">Phone Number</label>
            <input type="tel" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
              className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-fb-text-2 mb-1">Date of Birth</label>
              <input type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-fb-text-2 mb-1">Gender</label>
              <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as any }))}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue bg-white">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="UNSPECIFIED">Unspecified</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary" disabled={loading}>Cancel</button>
            <button type="submit" className="flex-1 btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const uid = Number(userId)
  const { user: me } = useAuth()

  const isValidUserId = Number.isInteger(uid) && uid > 0
  const isMe = isValidUserId && me?.user_id === uid

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'friends'>('none')
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('posts')
  const [friends, setFriends] = useState<User[]>([])
  const [mutualFriendsCount, setMutualFriendsCount] = useState<number | null>(null)
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [comments, setComments] = useState<{ comment_id: number; post_id: number; user_id: number; content: string; created_at: string; parent_comment_id?: number | null }[]>([])
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    let isCancelled = false

    if (!isValidUserId) {
      setLoading(false)
      setProfileUser(null)
      setPosts([])
      setFriends([])
      return
    }

    async function fetchData() {
      setLoading(true)
      setProfileUser(null)
      setPosts([])
      setFriends([])
      setMutualFriendsCount(null)
      setFriendStatus('none')
      setReactions([])
      setComments([])

      try {
        const profileRes = await userApi.getOne(uid)
        if (isCancelled) return

        setProfileUser(profileRes.data)

        const [postsRes, friendshipRes, profileFriendsRes] = await Promise.all([
          postApi.list({ limit: 50 }).catch(err => {
            console.error('Failed to fetch profile posts:', err)
            return null
          }),
          friendshipApi.getFriendshipData().catch(err => {
            console.error('Failed to fetch friendship data:', err)
            return null
          }),
          friendshipApi.getUserFriends(uid).catch(err => {
            console.error('Failed to fetch profile friends:', err)
            return null
          }),
        ])
        if (isCancelled) return

        const friendshipData = friendshipRes?.data ?? {
          friends: [],
          sent_requests: [],
          received_requests: [],
        }
        const visiblePosts = postsRes?.data ?? []

        // Fetch mutual friends count when viewing another user's profile
        if (me && uid !== me.user_id) {
          try {
            const mfRes = await queryApi.getMutualFriendsCount(me.user_id, uid)
            if (isCancelled) return
            setMutualFriendsCount(mfRes.data.mutual_friends_count ?? 0)
          } catch {
            setMutualFriendsCount(null)
          }
        } else {
          setMutualFriendsCount(null)
        }

        const myId = me?.user_id
        const friendIds = friendshipData.friends.map((f: { user_id: number }) => f.user_id)

        const userPosts = visiblePosts.filter(p => {
          if (p.user_id !== uid || p.group_id) return false
          if (p.visibility === 'PUBLIC') return true
          if (p.visibility === 'PRIVATE') return myId === uid
          if (p.visibility === 'FRIENDS') return myId === uid || friendIds.includes(uid)
          return false
        })
        const sortedUserPosts = userPosts.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        setPosts(sortedUserPosts)

        const postIds = sortedUserPosts.map(p => p.post_id)
        try {
          const reactionsRes = postIds.length
            ? await reactionApi.list(postIds)
            : { data: [] }
          if (isCancelled) return
          setReactions(reactionsRes.data)
        } catch (err) {
          console.error('Failed to fetch reactions:', err)
          if (isCancelled) return
          setReactions([])
        }

        setFriends(profileFriendsRes?.data ?? [])

        const isFriendWithProfile = friendshipData.friends.some((f: { user_id: number }) => f.user_id === uid)
        const sentRequestTo = friendshipData.sent_requests.some((r: { user_id: number }) => r.user_id === uid)
        const receivedRequestFrom = friendshipData.received_requests.some((r: { user_id: number }) => r.user_id === uid)

        if (isFriendWithProfile) setFriendStatus('friends')
        else if (sentRequestTo || receivedRequestFrom) setFriendStatus('pending')
        else setFriendStatus('none')

        setComments([])
      } catch (err) {
        console.error('Failed to fetch profile data:', err)
        if (isCancelled) return
        setPosts([])
        setFriends([])
        setProfileUser(null)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchData()

    return () => { isCancelled = true }
  }, [uid, isValidUserId, me?.user_id])

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
      } catch (err) { console.error('Failed to fetch comments:', err) }
    }
    fetchComments()
  }, [expandedPostId])

  async function handleSendFriendRequest() {
    if (!me || isMe) return
    setActionLoading(true)
    try {
      await friendshipApi.sendRequest(uid)
      setFriendStatus('pending')
      showToast('Friend request sent.', 'success')
    } catch (err: any) { showToast(err.message || 'Failed to send request.', 'error') }
    finally { setActionLoading(false) }
  }

  async function handleUnfriend() {
    if (!me) return
    setActionLoading(true)
    try {
      await friendshipApi.unfriend(uid)
      setFriendStatus('none')
      setFriends(prev => prev.filter(f => f.user_id !== me.user_id))
      showToast('Unfriended successfully.', 'success')
    } catch (err: any) { showToast(err.message || 'Failed to unfriend.', 'error') }
    finally { setActionLoading(false) }
  }

  const handleToggleComments = useCallback((postId: number) => {
    setExpandedPostId(prev => prev === postId ? null : postId)
  }, [])

  const targetUser = isMe ? me : profileUser

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-fb-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!targetUser || !isValidUserId) {
    return <div className="text-center py-20 text-fb-text-2">User not found.</div>
  }

  async function handlePost({ content, visibility }: { content: string; visibility: Visibility; user_id: number }) {
    try {
      const response = await postApi.create({ content, visibility })
      const newPost: Post = response.data
      setPosts(ps => [newPost, ...ps])
    } catch (err: any) {
      showToast(err.message || 'Failed to create post.', 'error')
    }
  }

  async function handleReact(postId: number, type: ReactType, userId: number) {
    const existing = reactions.find(r => r.post_id === postId && r.user_id === userId)
    try {
      if (existing) {
        if (existing.react_type === type) {
          await reactionApi.unreact(postId)
          setReactions(prev => prev.filter(r => !(r.post_id === postId && r.user_id === userId)))
          setPosts(prev => prev.map(p => p.post_id === postId
            ? { ...p, reaction_count: Math.max((p.reaction_count ?? 1) - 1, 0) }
            : p
          ))
        } else {
          const response = await reactionApi.react(postId, type)
          setReactions(prev => prev.map(r => r.post_id === postId && r.user_id === userId ? { ...r, ...response.data } : r))
        }
      } else {
        const response = await reactionApi.react(postId, type)
        setReactions(prev => [...prev, response.data])
        setPosts(prev => prev.map(p => p.post_id === postId
          ? { ...p, reaction_count: (p.reaction_count ?? 0) + 1 }
          : p
        ))
      }
    } catch (err: any) { showToast(err.message || 'Failed to react.', 'error') }
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
      showToast(err.message || 'Failed to comment.', 'error')
    }
  }

  async function handleShare(postId: number) {
    try {
      await postApi.share(postId)
      showToast('Post shared.', 'success')
    } catch (err: any) { showToast(err.message || 'Failed to share.', 'error') }
  }

  const GENDER_LABELS: Record<string, string> = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' }
  const fullName = targetUser.first_name && targetUser.last_name
    ? `${targetUser.first_name} ${targetUser.last_name}`
    : (targetUser.email?.split('@')[0] || 'User')
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=1877F2&color=fff&size=256`
  const TABS: { key: Tab; label: string }[] = [
    { key: 'posts', label: 'Posts' },
    { key: 'friends', label: 'Friends' },
    { key: 'photos', label: 'Photos' },
    { key: 'about', label: 'About' },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white ${toast.type === 'success' ? 'bg-fb-green' : 'bg-red-500'}`}>
          <span>{toast.type === 'success' ? '\u2713' : '\u2715'}</span>
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
        </div>
      )}

      {showEditModal && me && (
        <EditModal
          user={me}
          onClose={() => setShowEditModal(false)}
          onSuccess={msg => { showToast(msg, 'success'); window.location.reload() }}
        />
      )}

      <div className="card overflow-hidden mb-4">
        <div className="h-48 lg:h-64 bg-gradient-to-br from-fb-blue to-purple-600 relative" />
        <div className="px-4 pb-4 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-16">
            <img src={avatarUrl} alt={fullName} className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-white shadow" />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    {fullName}
                    {targetUser.is_verified && <span title="Verified" className="text-fb-blue text-lg">&#10003;</span>}
                  </h1>
                  <p className="text-fb-text-2 text-sm">
                    {mutualFriendsCount !== null
                      ? `${mutualFriendsCount} mutual friend${mutualFriendsCount !== 1 ? 's' : ''}`
                      : `${friends.length} friend${friends.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <div className="flex gap-2 mt-auto">
                  {isMe ? (
                    <button onClick={() => setShowEditModal(true)} className="btn-secondary text-sm px-4 py-2">Edit Profile</button>
                  ) : friendStatus === 'friends' ? (
                    <button onClick={handleUnfriend} disabled={actionLoading} className="btn-secondary text-sm px-4 py-2">Friends</button>
                  ) : friendStatus === 'pending' ? (
                    <button disabled className="btn-secondary text-sm px-4 py-2 opacity-60">Request Sent</button>
                  ) : (
                    <button onClick={handleSendFriendRequest} disabled={actionLoading} className="btn-primary text-sm px-4 py-2">+ Add Friend</button>
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
            <h3 className="font-bold">About</h3>
            {mutualFriendsCount !== null ? (
              <InfoRow icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.937-1.542m-2.016 2.016l-.52.52a10.003 10.003 0 01-3.477 3.477m1.477-1.477a10 10 0 013.477-3.477m.52-.52l-.52.52m0 0a9 9 0 01-12.733 0" /></svg>
              } label={`${mutualFriendsCount} mutual friend${mutualFriendsCount !== 1 ? 's' : ''}`} />
            ) : (
              <InfoRow icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.937-1.542m-2.016 2.016l-.52.52a10.003 10.003 0 01-3.477 3.477m1.477-1.477a10 10 0 013.477-3.477m.52-.52l-.52.52m0 0a9 9 0 01-12.733 0" /></svg>
              } label={`${friends.length} friend${friends.length !== 1 ? 's' : ''}`} />
            )}
            {targetUser.gender && targetUser.gender !== 'UNSPECIFIED' && (
              <InfoRow icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4a2 2 0 100-4 2 2 0 000 4zM12 4v16m-9-9h18" /></svg>
              } label={GENDER_LABELS[targetUser.gender] ?? ''} />
            )}
            {targetUser.is_admin && <InfoRow icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            } label="Administrator" />}
          </div>

          {friends.length > 0 && (
            <div className="card p-4">
              <div className="flex justify-between mb-3">
                <h3 className="font-bold">Friends</h3>
                <button onClick={() => setActiveTab('friends')} className="text-fb-blue text-sm hover:underline">See all</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {friends.slice(0, 9).map(f => (
                  <Link key={f.user_id} to={`/profile/${f.user_id}`}>
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent((f.first_name || '') + ' ' + (f.last_name || ''))}&background=1877F2&color=fff`}
                      className="w-full aspect-square rounded-lg object-cover"
                    />
                    <p className="text-xs mt-1 text-center truncate">
                      {f.first_name && f.last_name ? `${f.first_name} ${f.last_name}` : f.email?.split('@')[0] || 'User'}
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
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-fb-blue border-t-transparent rounded-full animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <div className="card p-8 text-center text-fb-text-2 text-sm">No posts yet.</div>
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
              <h3 className="font-bold text-lg mb-4">{friends.length} Friends</h3>
              {friends.length === 0 ? (
                <p className="text-fb-text-2 text-sm">No friends yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {friends.map(f => (
                    <Link key={f.user_id} to={`/profile/${f.user_id}`} className="hover:opacity-80 transition-opacity">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent((f.first_name || '') + ' ' + (f.last_name || ''))}&background=1877F2&color=fff`}
                        className="w-full aspect-square rounded-lg object-cover"
                      />
                      <p className="font-semibold text-sm mt-2 truncate">
                        {f.first_name && f.last_name ? `${f.first_name} ${f.last_name}` : f.email?.split('@')[0] || 'User'}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="card p-4">
              <h3 className="font-bold text-lg mb-4">Photos</h3>
              <p className="text-fb-text-2 text-sm">No photos yet.</p>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="card p-4">
              <h3 className="font-bold text-lg mb-4">About</h3>
              <div className="space-y-3">
                <InfoRow icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.937-1.542m-2.016 2.016l-.52.52a10.003 10.003 0 01-3.477 3.477m1.477-1.477a10 10 0 013.477-3.477m.52-.52l-.52.52m0 0a9 9 0 01-12.733 0" /></svg>
                } label={mutualFriendsCount !== null
                  ? `${mutualFriendsCount} mutual friend${mutualFriendsCount !== 1 ? 's' : ''}`
                  : `${friends.length} friend${friends.length !== 1 ? 's' : ''}`} />
                {targetUser.gender && targetUser.gender !== 'UNSPECIFIED' && (
                  <InfoRow icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4a2 2 0 100-4 2 2 0 000 4zM12 4v16m-9-9h18" /></svg>
                  } label={`Gender: ${GENDER_LABELS[targetUser.gender] || targetUser.gender}`} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-fb-text-2">
      {icon}
      <span>{label}</span>
    </div>
  )
}
