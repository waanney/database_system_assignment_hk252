import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { queryApi, friendshipApi, userApi, getErrorMessage, type User } from '../services/api'

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info'

interface ToastState {
  message: string
  type: ToastType
}

function Toast({ message, type, onDismiss }: { message: string; type: ToastType; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  const bg = { success: 'bg-fb-green', error: 'bg-red-500', info: 'bg-fb-blue' }[type]
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white transition-all ${bg}`}>
      <span>{type === 'success' ? '\u2713' : type === 'error' ? '\u2715' : '\u2139'}</span>
      <span className="font-medium">{message}</span>
      <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FriendsPage() {
  const { user } = useAuth()
  const [friends, setFriends] = useState<User[]>([])
  const [sentRequests, setSentRequests] = useState<User[]>([])
  const [receivedRequests, setReceivedRequests] = useState<User[]>([])
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  // Search state (stored procedure: search_friend)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type })
  }

  // Fetch friends (accepted) via direct API
  // Fetch pending (received) via stored procedure: search_pending_fr(p_user_id)
  // Fetch sent via stored procedure: search_sent_fr(p_user_id)
  useEffect(() => {
    if (!user) return
    setLoading(true)

    Promise.all([
      friendshipApi.getFriendshipData(),
      queryApi.getPendingRequests(),
      queryApi.getSentRequests(),
      userApi.list({ limit: 100 }),
    ]).then(([friendshipRes, pendingRes, sentRes, usersRes]) => {
      // Friends: accepted friendships
      const friendsData = friendshipRes.data.friends || []
      setFriends(friendsData)

      // Pending requests (received): via stored procedure search_pending_fr
      setReceivedRequests(pendingRes.data as User[])

      // Sent requests: via stored procedure search_sent_fr
      setSentRequests(sentRes.data as User[])

      // Suggestions: users who are not self, not friends, no pending/sent requests
      const allUsers: User[] = (usersRes.data as any).items || (usersRes.data as any).data || []
      const myId = user.user_id
      const friendIdSet = new Set(friendsData.map((f: User) => f.user_id))
      const sentIdSet = new Set(sentRes.data.map((u: any) => u.user_id))
      const receivedIdSet = new Set(pendingRes.data.map((u: any) => u.user_id))
      const filtered = (allUsers as User[]).filter((u: User) =>
        u.user_id !== myId &&
        !friendIdSet.has(u.user_id) &&
        !sentIdSet.has(u.user_id) &&
        !receivedIdSet.has(u.user_id)
      )
      setSuggestions(filtered)
    }).catch((err) => {
      console.error('Failed to fetch data:', err)
    }).finally(() => {
      setLoading(false)
    })
  }, [user?.user_id])

  // Search friends via stored procedure: search_friend(p_search_term, p_current_user_id)
  useEffect(() => {
    if (!user || !searchTerm.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        // Call stored procedure: search_friend
        const res = await queryApi.searchFriends(searchTerm.trim(), user.user_id)
        const currentFriendIds = friends.map((f: User) => f.user_id)
        const currentSentIds = sentRequests.map((u: User) => u.user_id)
        const currentReceivedIds = receivedRequests.map((u: User) => u.user_id)
        // Exclude self and existing relationships
        const filtered = (res.data as any[]).filter((u: User) =>
          u.user_id !== user.user_id &&
          !currentFriendIds.includes(u.user_id) &&
          !currentSentIds.includes(u.user_id) &&
          !currentReceivedIds.includes(u.user_id)
        )
        setSearchResults(filtered)
      } catch (err) {
        console.error('Search failed:', err)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, user?.user_id, friends, sentRequests, receivedRequests])

  const handleSendRequest = async (userId: number) => {
    setActionLoading(userId)
    try {
      await friendshipApi.sendRequest(userId)
      const userToMove = suggestions.find(u => u.user_id === userId)
      const searchUserToMove = searchResults.find(u => u.user_id === userId)
      const movedUser = userToMove || searchUserToMove

      setSuggestions(prev => prev.filter(u => u.user_id !== userId))
      setSearchResults(prev => prev.filter(u => u.user_id !== userId))
      setSentRequests(prev => movedUser ? [...prev, movedUser] : prev)
      showToast('Friend request sent.', 'success')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleAccept = async (userId: number) => {
    setActionLoading(userId)
    try {
      await friendshipApi.acceptRequest(userId)
      const userToMove = receivedRequests.find(u => u.user_id === userId)
      setReceivedRequests(prev => prev.filter(u => u.user_id !== userId))
      setSentRequests(prev => prev.filter(u => u.user_id !== userId))
      if (userToMove) setFriends(prev => [...prev, userToMove])
      showToast('Friend request accepted.', 'success')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDecline = async (userId: number) => {
    setActionLoading(userId)
    try {
      await friendshipApi.declineRequest(userId)
      setReceivedRequests(prev => prev.filter(u => u.user_id !== userId))
      showToast('Friend request declined.', 'success')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelRequest = async (userId: number) => {
    setActionLoading(userId)
    try {
      await friendshipApi.unfriend(userId)
      const userToRestore = sentRequests.find(u => u.user_id === userId)
      setSentRequests(prev => prev.filter(u => u.user_id !== userId))
      if (userToRestore) setSuggestions(prev => [...prev, userToRestore])
      showToast('Friend request cancelled.', 'success')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const getAvatar = (u: User) => {
    const first = u.first_name || ''
    const last = u.last_name || ''
    const name = [first, last].filter(Boolean).join(' ').trim() || u.email.split('@')[0] || 'User'
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1877F2&color=fff&size=128`
  }

  const getDisplayName = (u: User) =>
    (u.first_name && u.last_name) ? `${u.first_name} ${u.last_name}` : (u.email?.split('@')[0] || 'User')

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-fb-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      {/* Search Section (stored procedure: search_friend) */}
      <section className="card p-4">
        <h2 className="font-bold text-lg mb-3">Search Friends</h2>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-fb-gray-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name (uses stored procedure)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-fb-gray-3 rounded-full bg-fb-gray focus:outline-none focus:border-fb-blue text-fb-text placeholder:text-fb-gray-3"
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-fb-blue border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Search Results from stored procedure */}
        {searchTerm.trim() && (
          <div className="mt-3 space-y-2">
            {searchResults.length === 0 && !searchLoading && (
              <p className="text-sm text-fb-text-2 text-center py-3">No users found matching "{searchTerm}".</p>
            )}
            {searchResults.map(u => (
              <div key={u.user_id} className="flex items-center gap-3 p-3 bg-fb-gray rounded-lg hover:bg-fb-gray-2 transition-colors">
                <img src={getAvatar(u)} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${u.user_id}`} className="font-semibold text-sm hover:underline block truncate">
                    {getDisplayName(u)}
                  </Link>
                  <p className="text-xs text-fb-text-2 truncate">{u.email}</p>
                </div>
                <button
                  onClick={() => handleSendRequest(u.user_id)}
                  disabled={actionLoading === u.user_id}
                  className="flex-shrink-0 bg-fb-blue hover:bg-fb-blue-dark text-white text-sm font-semibold py-1.5 px-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading === u.user_id ? 'Sending...' : '+ Add Friend'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sent Requests (stored procedure: search_sent_fr) */}
      {sentRequests.length > 0 && (
        <section>
          <h2 className="font-bold text-xl mb-3">Sent Requests</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sentRequests.map(u => (
              <div key={u.user_id} className="card flex gap-3 p-3">
                <Link to={`/profile/${u.user_id}`}>
                  <img src={getAvatar(u)} className="w-16 h-16 rounded-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${u.user_id}`} className="font-semibold text-sm hover:underline block truncate">
                    {getDisplayName(u)}
                  </Link>
                  <p className="text-xs text-fb-text-2 mt-1">Pending</p>
                  <button
                    onClick={() => handleCancelRequest(u.user_id)}
                    disabled={actionLoading === u.user_id}
                    className="mt-2 w-full btn-secondary text-sm py-1.5"
                  >
                    {actionLoading === u.user_id ? 'Canceling...' : 'Cancel Request'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Received Requests (stored procedure: search_pending_fr) */}
      {receivedRequests.length > 0 && (
        <section>
          <h2 className="font-bold text-xl mb-3">Friend Requests</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {receivedRequests.map(u => (
              <div key={u.user_id} className="card flex gap-3 p-3">
                <Link to={`/profile/${u.user_id}`}>
                  <img src={getAvatar(u)} className="w-16 h-16 rounded-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${u.user_id}`} className="font-semibold text-sm hover:underline block truncate">
                    {getDisplayName(u)}
                  </Link>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleAccept(u.user_id)}
                      disabled={actionLoading === u.user_id}
                      className="flex-1 bg-fb-green hover:bg-green-600 text-white text-sm font-semibold py-1.5 rounded-lg transition-colors"
                    >
                      {actionLoading === u.user_id ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleDecline(u.user_id)}
                      disabled={actionLoading === u.user_id}
                      className="flex-1 btn-secondary text-sm py-1.5"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <section>
          <h2 className="font-bold text-xl mb-3">People You May Know</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {suggestions.map(u => (
              <div key={u.user_id} className="card overflow-hidden">
                <Link to={`/profile/${u.user_id}`}>
                  <img src={getAvatar(u)} className="w-full aspect-square object-cover" />
                </Link>
                <div className="p-3 space-y-2">
                  <Link to={`/profile/${u.user_id}`} className="font-semibold text-sm hover:underline block truncate">
                    {getDisplayName(u)}
                  </Link>
                  <button
                    onClick={() => handleSendRequest(u.user_id)}
                    disabled={actionLoading === u.user_id}
                    className="w-full bg-fb-blue hover:bg-fb-blue-dark text-white text-sm font-semibold py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading === u.user_id ? 'Sending...' : '+ Add Friend'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Friends */}
      <section>
        <h2 className="font-bold text-xl mb-3">All Friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <div className="card p-8 text-center text-fb-text-2 text-sm">You have no friends yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {friends.map(f => (
              <Link key={f.user_id} to={`/profile/${f.user_id}`} className="card overflow-hidden hover:shadow-md transition-shadow">
                <img src={getAvatar(f)} className="w-full aspect-square object-cover" />
                <div className="p-3">
                  <p className="font-semibold text-sm truncate">{getDisplayName(f)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
