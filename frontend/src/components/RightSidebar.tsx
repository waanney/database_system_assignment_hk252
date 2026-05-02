import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { friendshipApi, type User } from '../services/api.ts'

export default function RightSidebar() {
  const { user } = useAuth()
  const [friends, setFriends] = useState<User[]>([])

  useEffect(() => {
    if (!user) return
    friendshipApi.getFriendshipData().then(res => {
      setFriends(res.data.friends)
    }).catch(() => {})
  }, [user])

  return (
    <div>
      <p className="text-fb-text-2 font-semibold px-2 mb-2">Contacts</p>
      <div className="space-y-1">
        {friends.map(friend => (
          <Link
            key={friend.user_id}
            to={`/profile/${friend.user_id}`}
            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-fb-gray-2 transition-colors"
          >
            <div className="relative">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent((friend.first_name || '') + ' ' + (friend.last_name || ''))}&background=1877F2&color=fff`}
                className="w-9 h-9 rounded-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-fb-green rounded-full border-2 border-white" />
            </div>
            <span className="font-medium text-sm">
              {friend.first_name && friend.last_name
                ? `${friend.first_name} ${friend.last_name}`
                : friend.email?.split('@')[0] || 'User'}
            </span>
          </Link>
        ))}
        {friends.length === 0 && (
          <p className="text-fb-text-2 text-sm px-2">No friends yet.</p>
        )}
      </div>
    </div>
  )
}
