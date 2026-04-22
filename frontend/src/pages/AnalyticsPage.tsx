import { useState, useEffect, useCallback } from 'react'
import { queryApi, userApi, postApi, groupApi, type User, type Post } from '../services/api'

// ─── Toast ──────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info'

interface ToastState {
  message: string
  type: ToastType
}

function Toast({ toast, onDismiss }: { toast: ToastState | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [toast, onDismiss])

  if (!toast) return null

  const bg = { success: 'bg-fb-green', error: 'bg-red-500', info: 'bg-fb-blue' }[toast.type]
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white transition-all ${bg}`}>
      <span>{toast.type === 'success' ? '\u2713' : toast.type === 'error' ? '\u2715' : '\u2139'}</span>
      <span className="font-medium">{toast.message}</span>
      <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
    </div>
  )
}

// ─── Card ───────────────────────────────────────────────────────────────────

function Card({ title, description, icon, children }: { title: string; description: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        {icon && <div className="p-2.5 bg-fb-blue/10 rounded-xl text-fb-blue flex-shrink-0">{icon}</div>}
        <div>
          <h2 className="font-semibold text-fb-text text-lg">{title}</h2>
          <p className="text-sm text-fb-text-2 mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function ResultDisplay({ label, value, sublabel }: { label: string; value: string | number | null; sublabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-5 bg-fb-gray rounded-xl">
      <span className="text-sm text-fb-text-2 mb-1">{label}</span>
      <span className={`text-3xl font-bold ${value !== null ? 'text-fb-blue' : 'text-fb-gray-3'}`}>
        {value !== null ? value : '\u2014'}
      </span>
      {sublabel && <span className="text-xs text-fb-text-2 mt-1">{sublabel}</span>}
    </div>
  )
}

// ─── Section 1: Mutual Friends Calculator ───────────────────────────────────

function MutualFriendsSection({ users }: { users: User[] }) {
  const [user1Id, setUser1Id] = useState<number | ''>('')
  const [user2Id, setUser2Id] = useState<number | ''>('')
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const show = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type })
  }, [])

  const calculate = async () => {
    if (!user1Id || !user2Id) { show('Please select both users.', 'error'); return }
    if (user1Id === user2Id) { show('Please select two different users.', 'error'); return }
    setLoading(true)
    setCount(null)
    try {
      // Calls stored function: get_mutual_friends_count(user_id1, user_id2)
      const res = await queryApi.getMutualFriendsCount(Number(user1Id), Number(user2Id))
      const n = res.data.mutual_friends_count ?? 0
      setCount(n)
      show(`${n} mutual friend${n !== 1 ? 's' : ''} found.`, 'success')
    } catch (err: any) {
      show(err.message || 'Failed to calculate.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const user1 = users.find(u => u.user_id === user1Id)
  const user2 = users.find(u => u.user_id === user2Id)

  return (
    <Card
      title="Mutual Friends Calculator"
      description="Count shared friends between two users (stored function)"
      icon={
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
            <option value="">Select user\u2026</option>
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
            <option value="">Select user\u2026</option>
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
        {loading ? 'Calculating\u2026' : 'Calculate Mutual Friends'}
      </button>

      <div className="mt-5">
        <ResultDisplay
          label="Mutual Friends"
          value={count}
          sublabel={user1 && user2 ? `${user1.first_name} \u26a1 ${user2.first_name}` : undefined}
        />
      </div>
    </Card>
  )
}

// ─── Section 2: Post Reaction Score ─────────────────────────────────────────

function ReactionScoreSection() {
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedId, setSelectedId] = useState<number | ''>('')
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const show = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type })
  }, [])

  useEffect(() => {
    postApi.list({ limit: 50 }).then(res => setPosts(res.data)).catch(() => {})
  }, [])

  const preview = (content: string) =>
    content.length > 55 ? content.slice(0, 55) + '\u2026' : content

  const calculate = async () => {
    if (!selectedId) { show('Please select a post.', 'error'); return }
    setLoading(true)
    setScore(null)
    try {
      // Calls stored function: get_post_reaction_weighted_score(post_id)
      const res = await queryApi.getPostReactionScore(Number(selectedId))
      setScore(res.data.weighted_score)
      show(`Weighted reaction score: ${res.data.weighted_score}`, 'success')
    } catch (err: any) {
      show(err.message || 'Failed to get reaction score.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      title="Post Reaction Score"
      description="Weighted engagement score for a post (stored function)"
      icon={
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    >
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}

      <div className="mb-5">
        <label className="block text-sm font-medium text-fb-text-2 mb-1.5">Select Post</label>
        <select
          value={selectedId}
          onChange={e => { setSelectedId(Number(e.target.value)); setScore(null) }}
          className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue bg-white text-fb-text"
        >
          <option value="">Choose a post\u2026</option>
          {posts.map(p => (
            <option key={p.post_id} value={p.post_id}>
              #{p.post_id} \u2014 {preview(p.content)}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={calculate}
        disabled={!selectedId || loading}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Calculating\u2026' : 'Calculate Score'}
      </button>

      <div className="mt-5">
        <ResultDisplay
          label="Weighted Reaction Score"
          value={score}
          sublabel={selectedId ? `Post #${selectedId}` : undefined}
        />
      </div>
    </Card>
  )
}

// ─── Section 3: Group Member Analytics ──────────────────────────────────────

function GroupAnalyticsSection() {
  const [groups, setGroups] = useState<{ group_id: number; name: string }[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('')
  const [minPosts, setMinPosts] = useState('1')
  const [qualifiedMembers, setQualifiedMembers] = useState<any[]>([])
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const show = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type })
  }, [])

  useEffect(() => {
    groupApi.list({ limit: 100 }).then(res => setGroups(res.data)).catch(() => {})
  }, [])

  const analyze = async () => {
    if (!selectedGroupId) { show('Please select a group.', 'error'); return }
    const mp = parseInt(minPosts, 10)
    if (isNaN(mp) || mp < 0) { show('Please enter a valid minimum post count (0 or more).', 'error'); return }
    setLoading(true)
    setQualifiedMembers([])
    setCount(null)
    try {
      // Calls stored function: count_group_members_with_min_public_posts(group_id, min_posts)
      const res = await queryApi.countGroupMembersWithMinPosts(Number(selectedGroupId), mp)
      const members = res.data
      setQualifiedMembers(members)
      setCount(members.length)
      show(`${members.length} qualified member${members.length !== 1 ? 's' : ''}.`, 'success')
    } catch (err: any) {
      show(err.message || 'Failed to analyze group.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectedGroup = groups.find(g => g.group_id === selectedGroupId)

  return (
    <Card
      title="Group Member Analytics"
      description="Find members who meet a minimum post threshold (stored function)"
      icon={
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
            onChange={e => { setSelectedGroupId(Number(e.target.value)); setQualifiedMembers([]); setCount(null) }}
            className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue bg-white text-fb-text"
          >
            <option value="">Choose a group\u2026</option>
            {groups.map(g => (
              <option key={g.group_id} value={g.group_id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-fb-text-2 mb-1.5">Minimum Public Posts</label>
          <input
            type="number"
            min="0"
            value={minPosts}
            onChange={e => { setMinPosts(e.target.value); setQualifiedMembers([]); setCount(null) }}
            className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue"
          />
        </div>
      </div>

      <button
        onClick={analyze}
        disabled={!selectedGroupId || loading}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Analyzing\u2026' : 'Analyze Group'}
      </button>

      <div className="mt-5">
        <ResultDisplay
          label="Qualified Members"
          value={count}
          sublabel={selectedGroup ? `${selectedGroup.name} (\u2265 ${minPosts} posts)` : undefined}
        />
      </div>

      {qualifiedMembers.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-fb-text-2 mb-2">Qualified Members</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {qualifiedMembers.map(m => (
              <div key={m.user_id} className="flex items-center justify-between bg-fb-gray rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-fb-text">
                  {m.first_name} {m.last_name}
                </span>
                <span className="text-xs text-fb-text-2">{m.public_post_count ?? 0} public posts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

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
          Query results from stored functions and procedures
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
