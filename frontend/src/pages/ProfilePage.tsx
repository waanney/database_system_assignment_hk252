import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import PostCard from '../components/PostCard.tsx'
import {
  getUser, getProfile, getAvatar, getFullName,
  getFriends, isFriend,
  POSTS,
} from '../data/mockData.ts'

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const uid = Number(userId)
  const { user: me } = useAuth()

  const targetUser = getUser(uid)
  const profile    = getProfile(uid)
  const friendIds  = getFriends(uid)
  const isMe       = me?.user_id === uid
  const areFriends = isFriend(me?.user_id ?? 0, uid)

  const userPosts = POSTS
    .filter(p => p.user_id === uid)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (!targetUser) {
    return <div className="text-center py-20 text-fb-text-2">Người dùng không tồn tại.</div>
  }

  const GENDER_LABELS: Record<string, string> = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Cover + Avatar */}
      <div className="card overflow-hidden mb-4">
        <div className="h-48 lg:h-64 bg-gradient-to-br from-fb-blue to-purple-600 relative">
          {profile?.cover_page_url && (
            <img src={profile.cover_page_url} alt="" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="px-4 pb-4 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-16">
            <img
              src={getAvatar(uid)}
              alt={getFullName(uid)}
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-white shadow"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    {getFullName(uid)}
                    {targetUser.is_verified && <span title="Đã xác minh" className="text-fb-blue text-lg">✔️</span>}
                  </h1>
                  <p className="text-fb-text-2 text-sm">{friendIds.length} bạn bè</p>
                </div>
                <div className="flex gap-2 mt-auto">
                  {isMe ? (
                    <button className="btn-secondary text-sm px-4 py-2">✏️ Chỉnh sửa</button>
                  ) : areFriends ? (
                    <button className="btn-secondary text-sm px-4 py-2">👥 Bạn bè</button>
                  ) : (
                    <button className="btn-primary text-sm px-4 py-2">+ Thêm bạn bè</button>
                  )}
                  {!isMe && (
                    <button className="btn-secondary text-sm px-4 py-2">💬 Nhắn tin</button>
                  )}
                </div>
              </div>
              {profile?.bio && <p className="text-sm mt-2">{profile.bio}</p>}
            </div>
          </div>
        </div>

        <div className="flex border-t border-fb-gray-2 px-4">
          {['Bài viết', 'Bạn bè', 'Ảnh', 'Giới thiệu'].map((tab, i) => (
            <button key={tab}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors
                ${i === 0 ? 'border-fb-blue text-fb-blue' : 'border-transparent text-fb-text-2 hover:bg-fb-gray-2 rounded-lg'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        {/* Intro */}
        <div className="hidden lg:block w-64 flex-shrink-0 space-y-4">
          <div className="card p-4 space-y-3">
            <h3 className="font-bold">Giới thiệu</h3>
            {profile?.bio && <p className="text-sm text-center text-fb-text-2">{profile.bio}</p>}
            <InfoRow icon="👥" label={`${friendIds.length} bạn bè`} />
            {targetUser.gender && targetUser.gender !== 'UNSPECIFIED' && (
              <InfoRow icon="🏷️" label={GENDER_LABELS[targetUser.gender] ?? ''} />
            )}
            {targetUser.is_admin && <InfoRow icon="🛡️" label="Quản trị viên" />}
          </div>

          {friendIds.length > 0 && (
            <div className="card p-4">
              <div className="flex justify-between mb-3">
                <h3 className="font-bold">Bạn bè</h3>
                <Link to="/friends" className="text-fb-blue text-sm hover:underline">Xem tất cả</Link>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {friendIds.slice(0, 9).map(fid => (
                  <Link key={fid} to={`/profile/${fid}`}>
                    <img src={getAvatar(fid)} className="w-full aspect-square rounded-lg object-cover" />
                    <p className="text-xs mt-1 text-center truncate">{getFullName(fid).split(' ')[0]}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Posts */}
        <div className="flex-1 space-y-4">
          {userPosts.length === 0 ? (
            <div className="card p-8 text-center text-fb-text-2 text-sm">Chưa có bài viết nào.</div>
          ) : (
            userPosts.map(p => <PostCard key={p.post_id} post={p} />)
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
