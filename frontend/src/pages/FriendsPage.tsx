import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { USERS, getAvatar } from '../data/mockData.ts'
import { friendshipApi, userApi, getErrorMessage, type User } from '../services/api'

export default function FriendsPage() {
  const { user } = useAuth()
  const [friendshipData, setFriendshipData] = useState<{
    friends: User[]
    sent_requests: User[]
    received_requests: User[]
  }>({ friends: [], sent_requests: [], received_requests: [] })
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const friendIds = friendshipData.friends.map(f => f.user_id)
  const sentRequestIds = friendshipData.sent_requests.map(u => u.user_id)
  const receivedRequestIds = friendshipData.received_requests.map(u => u.user_id)

  // Fetch all friendship data and suggestions
  useEffect(() => {
    async function fetchData() {
      try {
        const [friendshipRes, usersRes] = await Promise.all([
          friendshipApi.getFriendshipData(),
          userApi.list({ limit: 100 })
        ])
        setFriendshipData(friendshipRes.data)

        // Filter suggestions: exclude current user, friends, and sent requests
        const allUsers = (usersRes.data as any).items || (usersRes.data as any).data || []
        const myId = user?.user_id
        const filtered = allUsers.filter((u: User) =>
          u.user_id !== myId &&
          !friendIds.includes(u.user_id) &&
          !sentRequestIds.includes(u.user_id) &&
          !receivedRequestIds.includes(u.user_id)
        )
        setSuggestions(filtered)
      } catch (err) {
        console.error('Failed to fetch data:', err)
        // Fall back to mock data
        setSuggestions(USERS.filter(u =>
          u.user_id !== user?.user_id &&
          !friendIds.includes(u.user_id) &&
          !sentRequestIds.includes(u.user_id)
        ))
      } finally {
        setLoading(false)
      }
    }
    if (user) fetchData()
  }, [user?.user_id, friendIds.join(','), sentRequestIds.join(','), receivedRequestIds.join(',')])

  async function handleSendRequest(userId: number) {
    setActionLoading(userId)
    try {
      await friendshipApi.sendRequest(userId)
      // Move from suggestions to sent requests
      const userToMove = suggestions.find(u => u.user_id === userId)
      if (userToMove) {
        setSuggestions(prev => prev.filter(u => u.user_id !== userId))
        setFriendshipData(prev => ({
          ...prev,
          sent_requests: [...prev.sent_requests, userToMove]
        }))
      }
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleAccept(userId: number) {
    setActionLoading(userId)
    try {
      await friendshipApi.acceptRequest(userId)
      // Move from received to friends
      const userToMove = friendshipData.received_requests.find(u => u.user_id === userId)
      if (userToMove) {
        setFriendshipData(prev => ({
          received_requests: prev.received_requests.filter(u => u.user_id !== userId),
          sent_requests: prev.sent_requests.filter(u => u.user_id !== userId),
          friends: [...prev.friends, userToMove]
        }))
      }
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDecline(userId: number) {
    setActionLoading(userId)
    try {
      await friendshipApi.declineRequest(userId)
      setFriendshipData(prev => ({
        ...prev,
        received_requests: prev.received_requests.filter(u => u.user_id !== userId)
      }))
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCancelRequest(userId: number) {
    setActionLoading(userId)
    try {
      await friendshipApi.unfriend(userId)
      // Get user data before removing from sent_requests
      const userToRestore = friendshipData.sent_requests.find(u => u.user_id === userId)
      setFriendshipData(prev => ({
        ...prev,
        sent_requests: prev.sent_requests.filter(u => u.user_id !== userId)
      }))
      // Add back to suggestions
      if (userToRestore) {
        setSuggestions(prev => [...prev, userToRestore])
      }
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-fb-text-2">Đang tải...</div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Sent Requests Section */}
      {friendshipData.sent_requests.length > 0 && (
        <section>
          <h2 className="font-bold text-xl mb-3">Đã gửi lời mời kết bạn</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {friendshipData.sent_requests.map(u => (
              <div key={u.user_id} className="card flex gap-3 p-3">
                <Link to={`/profile/${u.user_id}`}>
                  <img src={getAvatar(u.user_id)} className="w-16 h-16 rounded-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${u.user_id}`} className="font-semibold text-sm hover:underline block truncate">
                    {u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.email.split('@')[0]}
                  </Link>
                  <p className="text-xs text-fb-text-2 mt-1">Đang chờ xác nhận</p>
                  <button
                    onClick={() => handleCancelRequest(u.user_id)}
                    disabled={actionLoading === u.user_id}
                    className="mt-2 w-full btn-secondary text-sm py-1.5"
                  >
                    Hủy lời mời
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Received Requests Section */}
      {friendshipData.received_requests.length > 0 && (
        <section>
          <h2 className="font-bold text-xl mb-3">Lời mời kết bạn</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {friendshipData.received_requests.map(u => (
              <div key={u.user_id} className="card flex gap-3 p-3">
                <Link to={`/profile/${u.user_id}`}>
                  <img src={getAvatar(u.user_id)} className="w-16 h-16 rounded-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${u.user_id}`} className="font-semibold text-sm hover:underline block truncate">
                    {u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.email.split('@')[0]}
                  </Link>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleAccept(u.user_id)}
                      disabled={actionLoading === u.user_id}
                      className="flex-1 bg-fb-blue hover:bg-fb-blue-dark text-white text-sm font-semibold py-1.5 rounded-lg transition-colors"
                    >
                      Xác nhận
                    </button>
                    <button
                      onClick={() => handleDecline(u.user_id)}
                      disabled={actionLoading === u.user_id}
                      className="flex-1 btn-secondary text-sm py-1.5"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Suggestions Section */}
      {suggestions.length > 0 && (
        <section>
          <h2 className="font-bold text-xl mb-3">Những người bạn có thể biết</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {suggestions.map(u => (
              <div key={u.user_id} className="card overflow-hidden">
                <Link to={`/profile/${u.user_id}`}>
                  <img src={getAvatar(u.user_id)} className="w-full aspect-square object-cover" />
                </Link>
                <div className="p-3 space-y-2">
                  <Link to={`/profile/${u.user_id}`} className="font-semibold text-sm hover:underline block truncate">
                    {u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.email.split('@')[0]}
                  </Link>
                  <button
                    onClick={() => handleSendRequest(u.user_id)}
                    disabled={actionLoading === u.user_id}
                    className="w-full bg-fb-blue hover:bg-fb-blue-dark text-white text-sm font-semibold py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading === u.user_id ? 'Đang gửi...' : '+ Thêm bạn bè'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Friends Section */}
      <section>
        <h2 className="font-bold text-xl mb-3">Tất cả bạn bè ({friendshipData.friends.length})</h2>
        {friendshipData.friends.length === 0 ? (
          <div className="card p-8 text-center text-fb-text-2 text-sm">Bạn chưa có bạn bè nào.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {friendshipData.friends.map(f => (
              <Link key={f.user_id} to={`/profile/${f.user_id}`} className="card overflow-hidden hover:shadow-md transition-shadow">
                <img src={getAvatar(f.user_id)} className="w-full aspect-square object-cover" />
                <div className="p-3">
                  <p className="font-semibold text-sm truncate">
                    {f.first_name && f.last_name ? `${f.first_name} ${f.last_name}` : f.email.split('@')[0]}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
