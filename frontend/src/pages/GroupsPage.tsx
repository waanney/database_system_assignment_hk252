import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { groupApi, queryApi, getErrorMessage, type Group } from '../services/api'

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
    if (!name.trim()) { setError('Group name is required.'); return }
    setLoading(true)
    setError('')
    try {
      await groupApi.create({ name: name.trim(), description: description.trim() || undefined })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create group.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-fb-blue px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Create Group</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-fb-text-2 mb-1">Group Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Study Group HK252"
              className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fb-text-2 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Short description of the group..."
              rows={3}
              className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary" disabled={loading}>Cancel</button>
            <button type="submit" className="flex-1 btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function GroupsPage() {
  const { user } = useAuth()
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [allGroups, setAllGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningGroupId, setJoiningGroupId] = useState<number | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Search state (stored procedure: search_group)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  async function fetchGroups() {
    try {
      const [myGroupsRes, allGroupsRes] = await Promise.all([
        groupApi.getMyGroups(),
        groupApi.list({ limit: 100 }),
      ])
      setMyGroups(myGroupsRes.data)
      setAllGroups(allGroupsRes.data)
    } catch (err) {
      console.error('Failed to fetch groups:', err)
      setMyGroups([])
      setAllGroups([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchGroups()
  }, [user])

  // Search groups via stored procedure: search_group(p_search_term)
  useEffect(() => {
    if (!user || !searchTerm.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await queryApi.searchGroups(searchTerm.trim())
        setSearchResults(res.data as any[])
      } catch (err) {
        console.error('Search failed:', err)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, user?.user_id])

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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-fb-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchGroups}
        />
      )}

      {/* Search Section (stored procedure: search_group) */}
      <section className="card p-4">
        <h2 className="font-bold text-lg mb-3">Search Groups</h2>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-fb-gray-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search groups by name or description..."
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
              <p className="text-sm text-fb-text-2 text-center py-3">No groups found matching "{searchTerm}".</p>
            )}
            {searchResults.map(g => (
              <div key={g.group_id} className="flex items-center gap-3 p-3 bg-fb-gray rounded-lg hover:bg-fb-gray-2 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-fb-blue flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {g.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/groups/${g.group_id}`} className="font-semibold text-sm hover:underline block truncate">
                    {g.name}
                  </Link>
                  {g.description && (
                    <p className="text-xs text-fb-text-2 truncate">{g.description}</p>
                  )}
                </div>
                {myGroupIds.includes(g.group_id) ? (
                  <Link
                    to={`/groups/${g.group_id}`}
                    className="flex-shrink-0 bg-fb-green hover:bg-green-600 text-white text-sm font-semibold py-1.5 px-3 rounded-lg transition-colors"
                  >
                    View
                  </Link>
                ) : (
                  <button
                    onClick={() => handleJoinGroup(g.group_id)}
                    disabled={joiningGroupId === g.group_id}
                    className="flex-shrink-0 bg-fb-blue hover:bg-fb-blue-dark text-white text-sm font-semibold py-1.5 px-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {joiningGroupId === g.group_id ? 'Joining...' : '+ Join'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center justify-between">
        <h2 className="font-bold text-xl">Your Groups</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-fb-green hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          + Create Group
        </button>
      </div>

      <section>
        {myGroups.length === 0 ? (
          <div className="card p-8 text-center text-fb-text-2 text-sm">You have not joined any groups.</div>
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
          <h2 className="font-bold text-xl mb-3">Explore Groups</h2>
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

function GroupCard({ group, joined, onJoin, isJoining }: {
  group: Group
  joined?: boolean
  onJoin?: () => void
  isJoining?: boolean
}) {
  const memberCount = group.member_count ?? 0

  return (
    <div className="card overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/groups/${group.group_id}`}>
        <div className="h-32 bg-gradient-to-br from-purple-500 to-fb-blue relative">
          {group.cover_url && (
            <img src={group.cover_url} alt="" className="w-full h-full object-cover" />
          )}
        </div>
      </Link>
      <div className="p-3 space-y-2">
        <Link to={`/groups/${group.group_id}`} className="font-semibold hover:underline block">{group.name}</Link>
        <p className="text-fb-text-2 text-xs">{memberCount} member{memberCount !== 1 ? 's' : ''}</p>
        {group.description && <p className="text-sm text-fb-text-2 line-clamp-2">{group.description}</p>}
        {joined ? (
          <Link to={`/groups/${group.group_id}`} className="block w-full btn-secondary text-sm text-center py-1.5">
            View Group
          </Link>
        ) : onJoin ? (
          <button
            onClick={onJoin}
            disabled={isJoining}
            className="w-full bg-fb-blue hover:bg-fb-blue-dark text-white text-sm font-semibold py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {isJoining ? 'Joining...' : '+ Join Group'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
