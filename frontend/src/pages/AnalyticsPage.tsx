import { useState, useEffect, useCallback } from 'react'
import { userApi, groupApi, queryApi, type User, type Group } from '../services/api'

// ─── Toast State Type ─────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info'

interface ToastState {
  message: string
  type: ToastType
}

// ─── Toast Component ─────────────────────────────────────────────────────────

function Toast({ toast, onDismiss }: { toast: ToastState | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [toast, onDismiss])

  if (!toast) return null

  const bgMap = { success: 'bg-fb-green', error: 'bg-red-500', info: 'bg-fb-blue' }
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white transition-all ${bgMap[toast.type]}`}>
      <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}</span>
      <span className="font-medium">{toast.message}</span>
      <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
    </div>
  )
}

// ─── Section Card ───────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
}

function SectionCard({ title, description, icon, children }: SectionCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-fb-blue/10 rounded-xl text-fb-blue">{icon}</div>
        <div>
          <h2 className="font-semibold text-fb-text text-lg">{title}</h2>
          <p className="text-sm text-fb-text-2">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

// ─── Result Display ─────────────────────────────────────────────────────────

interface ResultDisplayProps {
  label: string
  value: string | number | null
  sublabel?: string
}

function ResultDisplay({ label, value, sublabel }: ResultDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center p-5 bg-fb-gray rounded-xl">
      <span className="text-sm text-fb-text-2 mb-1">{label}</span>
      <span className={`text-3xl font-bold ${value !== null ? 'text-fb-blue' : 'text-fb-gray-3'}`}>
        {value !== null ? value : '—'}
      </span>
      {sublabel && <span className="text-xs text-fb-text-2 mt-1">{sublabel}</span>}
    </div>
  )
}

// ─── Mutual Friends Calculator ─────────────────────────────────────────────

function MutualFriendsSection({ users }: { users: User[] }) {
  const [user1Id, setUser1Id] = useState<number | ''>('')
  const [user2Id, setUser2Id] = useState<number | ''>('')
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)

  const user1 = users.find(u => u.user_id === user1Id)
  const user2 = users.find(u => u.user_id === user2Id)

  const showToast = useCallback((message: string, type: ToastState['type'] = 'info') => {
    setToast({ message, type })
  }, [])

  const calculate = async () => {
    if (!user1Id || !user2Id) { showToast('Please select both users.', 'error'); return }
    if (user1Id === user2Id) { showToast('Please select two different users.', 'error'); return }
    setLoading(true)
    try {
      const res = await queryApi.getMutualFriendsCount(Number(user1Id), Number(user2Id))
      setCount(res.data.count)
      showToast(`Found ${res.data.count} mutual friend${res.data.count !== 1 ? 's' : ''}!`, 'success')
    } catch (err: any) {
      setCount(null)
      showToast(err.message || 'Failed to calculate.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SectionCard
      title="Mutual Friends Calculator"
      description="Find how many friends two users share in common"
      icon={
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.937-1.542m-2.016 2.016l-.52.52a10.003 10.003 0 01-3.477 3.477m1.477-1.477a10 10 0 013.477-3.477m.52-.52l-.52.52m0 0a9 9 0 01-12.733 0" />
        </svg>
      }
    >
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-fb-text-2 mb-1.5">User 1</label>
          <select
            value={user1Id}
            onChange={e => { setUser1Id(Number(e.target.value)); setCount(null) }}
            className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue bg-white text-fb-text"
          >
            <option value="">Select user…</option>
            {users.map(u => (
              <option key={u.user_id} value={u.user_id}>
                {u.first_name} {u.last_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-center text-fb-text-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>

        <div>
          <label className="block text-sm font-medium text-fb-text-2 mb-1.5">User 2</label>
          <select
            value={user2Id}
            onChange={e => { setUser2Id(Number(e.target.value)); setCount(null) }}
            className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue bg-white text-fb-text"
          >
            <option value="">Select user…</option>
            {users.map(u => (
              <option key={u.user_id} value={u.user_id}>
                {u.first_name} {u.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={calculate}
        disabled={!user1Id || !user2Id || loading}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Calculating…' : 'Calculate Mutual Friends'}
      </button>

      <div className="mt-5">
        <ResultDisplay
          label="Mutual Friends"
          value={count}
          sublabel={
            user1 && user2
              ? `${user1.first_name} & ${user2.first_name}`
              : undefined
          }
        />
      </div>
    </SectionCard>
  )
}

// ─── Post Reaction Score ────────────────────────────────────────────────────

function ReactionScoreSection() {
  const [allPosts, setAllPosts] = useState<{ post_id: number; content: string; user_id: number }[]>([])
  const [selectedPostId, setSelectedPostId] = useState<number | ''>('')
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)

  const showToast = useCallback((message: string, type: ToastState['type'] = 'info') => {
    setToast({ message, type })
  }, [])

  useEffect(() => {
    // Load posts for selection
    import('../services/api').then(({ postApi }) => {
      postApi.list({ limit: 50 }).then(res => setAllPosts(res.data)).catch(() => {})
    })
  }, [])

  const getPostPreview = (content: string) =>
    content.length > 60 ? content.slice(0, 60) + '…' : content

  const calculate = async () => {
    if (!selectedPostId) { showToast('Please select a post.', 'error'); return }
    setLoading(true)
    try {
      const res = await queryApi.getPostReactionScore(Number(selectedPostId))
      setScore(res.data.score)
      showToast(`Reaction score: ${res.data.score}`, 'success')
    } catch (err: any) {
      setScore(null)
      showToast(err.message || 'Failed to get reaction score.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SectionCard
      title="Post Reaction Score"
      description="Calculate weighted engagement score for a post"
      icon={
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    >
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}

      <div className="mb-5">
        <label className="block text-sm font-medium text-fb-text-2 mb-1.5">Select Post</label>
        <select
          value={selectedPostId}
          onChange={e => { setSelectedPostId(Number(e.target.value)); setScore(null) }}
          className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue bg-white text-fb-text"
        >
          <option value="">Choose a post…</option>
          {allPosts.map(p => (
            <option key={p.post_id} value={p.post_id}>
              #{p.post_id} — {getPostPreview(p.content)}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={calculate}
        disabled={!selectedPostId || loading}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Calculating…' : 'Calculate Score'}
      </button>

      <div className="mt-5">
        <ResultDisplay
          label="Weighted Reaction Score"
          value={score}
          sublabel={selectedPostId ? `Post #${selectedPostId}` : undefined}
        />
      </div>
    </SectionCard>
  )
}

// ─── Group Analytics ────────────────────────────────────────────────────────

function GroupAnalyticsSection() {
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('')
  const [minPosts, setMinPosts] = useState<string>('5')
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)

  const showToast = useCallback((message: string, type: ToastState['type'] = 'info') => {
    setToast({ message, type })
  }, [])

  useEffect(() => {
    groupApi.list({ limit: 100 }).then(res => setGroups(res.data)).catch(() => {})
  }, [])

  const selectedGroup = groups.find(g => g.group_id === selectedGroupId)

  const analyze = async () => {
    if (!selectedGroupId) { showToast('Please select a group.', 'error'); return }
    const mp = parseInt(minPosts, 10)
    if (isNaN(mp) || mp < 0) { showToast('Please enter a valid minimum post count.', 'error'); return }
    setLoading(true)
    try {
      const res = await queryApi.countGroupMembersWithMinPosts(Number(selectedGroupId), mp)
      setCount(res.data.count)
      showToast(`${res.data.count} member${res.data.count !== 1 ? 's' : ''} qualified.`, 'success')
    } catch (err: any) {
      setCount(null)
      showToast(err.message || 'Failed to analyze group.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SectionCard
      title="Group Member Analytics"
      description="Count members who meet minimum post threshold"
      icon={
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      }
    >
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-fb-text-2 mb-1.5">Select Group</label>
          <select
            value={selectedGroupId}
            onChange={e => { setSelectedGroupId(Number(e.target.value)); setCount(null) }}
            className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue bg-white text-fb-text"
          >
            <option value="">Choose a group…</option>
            {groups.map(g => (
              <option key={g.group_id} value={g.group_id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-fb-text-2 mb-1.5">Minimum Posts</label>
          <input
            type="number"
            min="0"
            value={minPosts}
            onChange={e => { setMinPosts(e.target.value); setCount(null) }}
            className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue"
            placeholder="e.g. 5"
          />
        </div>
      </div>

      <button
        onClick={analyze}
        disabled={!selectedGroupId || loading}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Analyzing…' : 'Analyze Group'}
      </button>

      <div className="mt-5">
        <ResultDisplay
          label="Qualified Members"
          value={count}
          sublabel={
            selectedGroup
              ? `${selectedGroup.name} (≥ ${minPosts} posts)`
              : undefined
          }
        />
      </div>
    </SectionCard>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    userApi.getAll()
      .then(res => setUsers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-fb-text">Analytics Dashboard</h1>
        <p className="text-fb-text-2 text-sm mt-1">
          Visualize stored function results and database metrics
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-fb-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MutualFriendsSection users={users} />
          <ReactionScoreSection />
          <div className="lg:col-span-2">
            <GroupAnalyticsSection />
          </div>
        </div>
      )}
    </div>
  )
}