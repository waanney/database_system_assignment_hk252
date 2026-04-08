import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import PostCard from '../components/PostCard.tsx'
import CreatePostBox from '../components/CreatePostBox.tsx'
import {
  GROUPS, POSTS, getGroupMembers, getGroupRules,
  getAvatar, getFullName,
  type Post, type Visibility,
} from '../data/mockData.ts'

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const gid = Number(groupId)
  const { user } = useAuth()

  const group     = GROUPS.find(g => g.group_id === gid)
  const memberIds = getGroupMembers(gid)
  const rules     = getGroupRules(gid)
  const isMember  = memberIds.includes(user?.user_id ?? 0)

  const [posts, setPosts] = useState<Post[]>(() =>
    POSTS
      .filter(p => memberIds.includes(p.user_id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  )

  function handlePost({ content, visibility, user_id }: { content: string; visibility: Visibility; user_id: number }) {
    setPosts(ps => [{
      post_id:    Date.now(),
      user_id,
      content,
      visibility,
      created_at: new Date().toISOString(),
    }, ...ps])
  }

  if (!group) {
    return <div className="text-center py-20 text-fb-text-2">Nhóm không tồn tại.</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cover */}
      <div className="card overflow-hidden mb-4">
        <div className="h-48 lg:h-64 bg-gradient-to-br from-purple-600 to-fb-blue">
          {group.cover_url && <img src={group.cover_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <p className="text-fb-text-2 text-sm">
                {group.privacy === 'PRIVATE' ? '🔒 Nhóm riêng tư' : '🌐 Nhóm công khai'}
                {' · '}{memberIds.length} thành viên
              </p>
            </div>
            {isMember ? (
              <button className="btn-secondary px-4 py-2 text-sm">✓ Đã tham gia</button>
            ) : (
              <button className="btn-primary px-4 py-2 text-sm">+ Tham gia nhóm</button>
            )}
          </div>
        </div>
        <div className="flex border-t border-fb-gray-2 px-4">
          {['Thảo luận', 'Thành viên', 'Nội quy'].map((tab, i) => (
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
        {/* Left sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0 space-y-4">
          <div className="card p-4 space-y-2">
            <h3 className="font-bold">Giới thiệu</h3>
            {group.description && <p className="text-sm text-fb-text-2">{group.description}</p>}
            <p className="text-sm text-fb-text-2">👤 {getFullName(group.owner_id)} · Chủ nhóm</p>
            <p className="text-sm text-fb-text-2">👥 {memberIds.length} thành viên</p>
          </div>

          <div className="card p-4">
            <h3 className="font-bold mb-3">Thành viên</h3>
            <div className="space-y-2">
              {memberIds.map(uid => (
                <Link key={uid} to={`/profile/${uid}`}
                  className="flex items-center gap-2 hover:bg-fb-gray rounded-lg p-1 transition-colors">
                  <img src={getAvatar(uid)} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-medium">{getFullName(uid)}</p>
                    {uid === group.owner_id && <p className="text-xs text-fb-text-2">Chủ nhóm</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {rules.length > 0 && (
            <div className="card p-4">
              <h3 className="font-bold mb-3">Nội quy nhóm</h3>
              <ol className="space-y-2">
                {rules.map(r => (
                  <li key={r.rule_id} className="text-sm">
                    <p className="font-semibold">{r.rule_id}. {r.title}</p>
                    {r.description && <p className="text-fb-text-2 text-xs">{r.description}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Feed */}
        <div className="flex-1 space-y-4">
          {isMember && <CreatePostBox onPost={handlePost} />}
          {posts.length === 0 ? (
            <div className="card p-8 text-center text-fb-text-2 text-sm">
              Chưa có bài viết nào trong nhóm.
            </div>
          ) : (
            posts.map(p => <PostCard key={p.post_id} post={p} />)
          )}
        </div>
      </div>
    </div>
  )
}
