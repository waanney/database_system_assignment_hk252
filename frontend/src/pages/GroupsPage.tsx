import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { groupApi, getErrorMessage, type Group as ApiGroup } from '../services/api'

interface CreateGroupModalProps {
  onClose: () => void
  onSuccess: () => void
}

function CreateGroupModal({ onClose, onSuccess }: CreateGroupModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Tên nhóm không được trống.'); return }
    setLoading(true)
    setError('')
    try {
      await groupApi.create({ name: name.trim(), description: description.trim() || undefined })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Tạo nhóm thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-fb-blue px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Tạo nhóm mới</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-fb-text-2 mb-1">Tên nhóm *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="VD: Nhóm học tập HK252"
              className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fb-text-2 mb-1">Mô tả</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về nhóm..."
              rows={3}
              className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary" disabled={loading}>Hủy</button>
            <button type="submit" className="flex-1 btn-primary" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo nhóm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function GroupsPage() {
  const { user } = useAuth()
  const [myGroups, setMyGroups] = useState<ApiGroup[]>([])
  const [allGroups, setAllGroups] = useState<ApiGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningGroupId, setJoiningGroupId] = useState<number | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  async function fetchGroups() {
    try {
      const [myGroupsRes, allGroupsRes] = await Promise.all([
        groupApi.getMyGroups(),
        groupApi.list({ limit: 100 })
      ])
      setMyGroups(myGroupsRes.data)
      setAllGroups(allGroupsRes.data)
    } catch (err) {
      console.error('Failed to fetch groups:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchGroups()
  }, [user])

  async function handleJoinGroup(groupId: number) {
    setJoiningGroupId(groupId)
    try {
      await groupApi.join(groupId)
      await fetchGroups()
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setJoiningGroupId(null)
    }
  }

  const myGroupIds = myGroups.map(g => g.group_id)
  const otherGroups = allGroups.filter(g => !myGroupIds.includes(g.group_id))

  if (loading) {
    return <div className="text-center py-20 text-fb-text-2">Đang tải...</div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchGroups}
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-bold text-xl">Nhóm của bạn</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-fb-green hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          + Tạo nhóm
        </button>
      </div>

      <section>
        {myGroups.length === 0 ? (
          <div className="card p-8 text-center text-fb-text-2 text-sm">Bạn chưa tham gia nhóm nào.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myGroups.map(g => (
              <GroupCard key={g.group_id} group={g} joined />
            ))}
          </div>
        )}
      </section>

      {otherGroups.length > 0 && (
        <section>
          <h2 className="font-bold text-xl mb-3">Khám phá nhóm</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {otherGroups.map(g => (
              <GroupCard
                key={g.group_id}
                group={g}
                onJoin={() => handleJoinGroup(g.group_id)}
                isJoining={joiningGroupId === g.group_id}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

interface GroupCardProps {
  group: ApiGroup
  joined?: boolean
  onJoin?: () => void
  isJoining?: boolean
}

function GroupCard({ group, joined, onJoin, isJoining }: GroupCardProps) {
  const memberCount = group.member_count ?? 0
  const groupUrl = `/groups/${group.group_id}`

  return (
    <div className="card overflow-hidden hover:shadow-md transition-shadow">
      <Link to={groupUrl}>
        <div className="h-32 bg-gradient-to-br from-purple-500 to-fb-blue relative">
          {group.cover_url && (
            <img src={group.cover_url} alt="" className="w-full h-full object-cover" />
          )}
        </div>
      </Link>
      <div className="p-3 space-y-2">
        <Link to={groupUrl} className="font-semibold hover:underline block">{group.name}</Link>
        <p className="text-fb-text-2 text-xs">{memberCount} thành viên</p>
        {group.description && <p className="text-sm text-fb-text-2 line-clamp-2">{group.description}</p>}
        {joined ? (
          <Link to={groupUrl} className="block w-full btn-secondary text-sm text-center py-1.5">
            Xem nhóm
          </Link>
        ) : onJoin ? (
          <button
            onClick={onJoin}
            disabled={isJoining}
            className="w-full bg-fb-blue hover:bg-fb-blue-dark text-white text-sm font-semibold py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {isJoining ? 'Đang tham gia...' : '+ Tham gia nhóm'}
          </button>
        ) : null}
      </div>
    </div>
  )
}

