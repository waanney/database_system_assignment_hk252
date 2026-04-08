import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { getFriends, getAvatar, getFullName } from '../data/mockData.ts'

export default function RightSidebar() {
  const { user } = useAuth()
  const friendIds = getFriends(user?.user_id ?? 0)

  return (
    <div>
      <p className="text-fb-text-2 font-semibold px-2 mb-2">Liên hệ</p>
      <div className="space-y-1">
        {friendIds.map(fid => (
          <Link
            key={fid}
            to={`/profile/${fid}`}
            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-fb-gray-2 transition-colors"
          >
            <div className="relative">
              <img src={getAvatar(fid)} className="w-9 h-9 rounded-full object-cover" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-fb-green rounded-full border-2 border-white" />
            </div>
            <span className="font-medium text-sm">{getFullName(fid)}</span>
          </Link>
        ))}
        {friendIds.length === 0 && (
          <p className="text-fb-text-2 text-sm px-2">Chưa có bạn bè nào.</p>
        )}
      </div>
    </div>
  )
}
