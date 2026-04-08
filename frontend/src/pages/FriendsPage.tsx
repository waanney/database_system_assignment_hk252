import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { USERS, getFriends, getFriendRequests, getAvatar, getFullName } from '../data/mockData.ts'

export default function FriendsPage() {
  const { user } = useAuth()
  const friendIds  = getFriends(user?.user_id ?? 0)
  const requestIds = getFriendRequests(user?.user_id ?? 0)
  const suggestions = USERS.filter(u =>
    u.user_id !== user?.user_id &&
    !friendIds.includes(u.user_id) &&
    !requestIds.includes(u.user_id)
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {requestIds.length > 0 && (
        <section>
          <h2 className="font-bold text-xl mb-3">Lời mời kết bạn</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {requestIds.map(uid => <FriendRequestCard key={uid} userId={uid} />)}
          </div>
        </section>
      )}

      {suggestions.length > 0 && (
        <section>
          <h2 className="font-bold text-xl mb-3">Những người bạn có thể biết</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {suggestions.map(u => <SuggestionCard key={u.user_id} userId={u.user_id} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-bold text-xl mb-3">Tất cả bạn bè ({friendIds.length})</h2>
        {friendIds.length === 0 ? (
          <div className="card p-8 text-center text-fb-text-2 text-sm">Bạn chưa có bạn bè nào.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {friendIds.map(fid => (
              <Link key={fid} to={`/profile/${fid}`} className="card overflow-hidden hover:shadow-md transition-shadow">
                <img src={getAvatar(fid)} className="w-full aspect-square object-cover" />
                <div className="p-3">
                  <p className="font-semibold text-sm">{getFullName(fid)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function FriendRequestCard({ userId }: { userId: number }) {
  return (
    <div className="card flex gap-3 p-3">
      <Link to={`/profile/${userId}`}>
        <img src={getAvatar(userId)} className="w-16 h-16 rounded-full object-cover" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/profile/${userId}`} className="font-semibold text-sm hover:underline block">
          {getFullName(userId)}
        </Link>
        <div className="flex gap-2 mt-2">
          <button className="flex-1 bg-fb-blue hover:bg-fb-blue-dark text-white text-sm font-semibold py-1.5 rounded-lg transition-colors">
            Xác nhận
          </button>
          <button className="flex-1 btn-secondary text-sm py-1.5">Xóa</button>
        </div>
      </div>
    </div>
  )
}

function SuggestionCard({ userId }: { userId: number }) {
  return (
    <div className="card overflow-hidden">
      <Link to={`/profile/${userId}`}>
        <img src={getAvatar(userId)} className="w-full aspect-square object-cover" />
      </Link>
      <div className="p-3 space-y-2">
        <Link to={`/profile/${userId}`} className="font-semibold text-sm hover:underline block">
          {getFullName(userId)}
        </Link>
        <button className="w-full bg-fb-blue hover:bg-fb-blue-dark text-white text-sm font-semibold py-1.5 rounded-lg transition-colors">
          + Thêm bạn bè
        </button>
        <button className="w-full btn-secondary text-sm py-1.5">Gỡ</button>
      </div>
    </div>
  )
}
