import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { queryApi, userApi, postApi, groupApi, type User, type Post } from '../services/api'

type ToastType = 'success' | 'error' | 'info'

interface ToastState {
  message: string
  type: ToastType
}

const fieldClass =
  'h-11 w-full min-w-0 rounded-lg border border-fb-gray-3 bg-white px-3 text-sm text-fb-text outline-none transition focus:border-fb-blue focus:ring-2 focus:ring-fb-blue/15 disabled:cursor-not-allowed disabled:bg-fb-gray'

function Toast({ toast, onDismiss }: { toast: ToastState | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [toast, onDismiss])

  if (!toast) return null

  const bg = { success: 'bg-fb-green', error: 'bg-red-500', info: 'bg-fb-blue' }[toast.type]
  const label = { success: 'OK', error: 'Error', info: 'Info' }[toast.type]

  return (
    <div className={`fixed bottom-5 right-5 z-[100] flex max-w-sm items-center gap-3 rounded-lg px-4 py-3 text-white shadow-lg ${bg}`}>
      <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wide">{label}</span>
      <span className="min-w-0 flex-1 text-sm font-medium">{toast.message}</span>
      <button
        onClick={onDismiss}
        className="rounded px-1 text-lg leading-none opacity-75 hover:bg-white/15 hover:opacity-100"
        aria-label="Dismiss notification"
      >
        &times;
      </button>
    </div>
  )
}

function PageCard({
  title,
  description,
  icon,
  children,
  className = '',
}: {
  title: string
  description: string
  icon: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`card border border-fb-gray-2 p-5 shadow-sm ${className}`}>
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-fb-blue/10 text-fb-blue">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-tight text-fb-text">{title}</h2>
          <p className="mt-1 text-sm leading-snug text-fb-text-2">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-semibold text-fb-text-2">{label}</span>
      {children}
    </label>
  )
}

function ResultDisplay({
  label,
  value,
  sublabel,
}: {
  label: string
  value: string | number | null
  sublabel?: string
}) {
  return (
    <div className="rounded-lg border border-fb-gray-2 bg-fb-gray px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fb-text">{label}</p>
          {sublabel && <p className="mt-0.5 truncate text-xs text-fb-text-2">{sublabel}</p>}
        </div>
        <span className={`text-2xl font-bold ${value !== null ? 'text-fb-blue' : 'text-fb-gray-3'}`}>
          {value !== null ? value : '--'}
        </span>
      </div>
    </div>
  )
}

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
    if (!user1Id || !user2Id) {
      show('Please select both users.', 'error')
      return
    }
    if (user1Id === user2Id) {
      show('Please select two different users.', 'error')
      return
    }

    setLoading(true)
    setCount(null)
    try {
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
    <PageCard
      title="Mutual Friends"
      description="Compare two profiles using the mutual-friends stored function."
      icon={
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 11a4 4 0 118 0M4 20a8 8 0 0116 0M17 7h4m-2-2v4" />
        </svg>
      }
    >
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <Field label="First user">
          <select
            value={user1Id}
            onChange={e => {
              setUser1Id(e.target.value ? Number(e.target.value) : '')
              setCount(null)
            }}
            className={fieldClass}
          >
            <option value="">Select user...</option>
            {users.map(u => (
              <option key={u.user_id} value={u.user_id}>
                {u.first_name} {u.last_name}
              </option>
            ))}
          </select>
        </Field>

        <div className="hidden h-11 items-center justify-center text-fb-text-2 sm:flex">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>

        <Field label="Second user">
          <select
            value={user2Id}
            onChange={e => {
              setUser2Id(e.target.value ? Number(e.target.value) : '')
              setCount(null)
            }}
            className={fieldClass}
          >
            <option value="">Select user...</option>
            {users.map(u => (
              <option key={u.user_id} value={u.user_id}>
                {u.first_name} {u.last_name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4 grid gap-3">
        <button
          onClick={calculate}
          disabled={!user1Id || !user2Id || loading}
          className="btn-primary h-11 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Calculating...' : 'Calculate Mutual Friends'}
        </button>

        <ResultDisplay
          label="Shared friends"
          value={count}
          sublabel={user1 && user2 ? `${user1.first_name} to ${user2.first_name}` : 'Select two different users'}
        />
      </div>
    </PageCard>
  )
}

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

  const preview = (content: string) => (content.length > 55 ? `${content.slice(0, 55)}...` : content)

  const calculate = async () => {
    if (!selectedId) {
      show('Please select a post.', 'error')
      return
    }

    setLoading(true)
    setScore(null)
    try {
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
    <PageCard
      title="Post Reaction Score"
      description="Calculate weighted engagement for one post."
      icon={
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 9h4m-2-2v4M7 13h.01M10 16a4 4 0 004 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    >
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}

      <div className="grid gap-4">
        <Field label="Post">
          <select
            value={selectedId}
            onChange={e => {
              setSelectedId(e.target.value ? Number(e.target.value) : '')
              setScore(null)
            }}
            className={fieldClass}
          >
            <option value="">Choose a post...</option>
            {posts.map(p => (
              <option key={p.post_id} value={p.post_id}>
                #{p.post_id} - {preview(p.content)}
              </option>
            ))}
          </select>
        </Field>

        <button
          onClick={calculate}
          disabled={!selectedId || loading}
          className="btn-primary h-11 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Calculating...' : 'Calculate Score'}
        </button>

        <ResultDisplay
          label="Weighted score"
          value={score}
          sublabel={selectedId ? `Post #${selectedId}` : 'Likes, loves, and reactions are weighted'}
        />
      </div>
    </PageCard>
  )
}

function GroupAnalyticsSection() {
  const [groups, setGroups] = useState<{ group_id: number; name: string }[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('')
  const [minPosts, setMinPosts] = useState('1')
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
    if (!selectedGroupId) {
      show('Please select a group.', 'error')
      return
    }

    const mp = parseInt(minPosts, 10)
    if (isNaN(mp) || mp < 0) {
      show('Please enter a valid minimum post count (0 or more).', 'error')
      return
    }

    setLoading(true)
    setCount(null)
    try {
      const res = await queryApi.countGroupMembersWithMinPosts(Number(selectedGroupId), mp)
      const qualifiedCount = res.data.qualified_member_count ?? 0
      setCount(qualifiedCount)
      show(`${qualifiedCount} qualified member${qualifiedCount !== 1 ? 's' : ''}.`, 'success')
    } catch (err: any) {
      show(err.message || 'Failed to analyze group.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectedGroup = groups.find(g => g.group_id === selectedGroupId)

  return (
    <PageCard
      title="Group Member Analytics"
      description="Count members who meet a minimum public-post threshold."
      className="lg:col-span-2"
      icon={
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      }
    >
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
        <Field label="Group">
          <select
            value={selectedGroupId}
            onChange={e => {
              setSelectedGroupId(e.target.value ? Number(e.target.value) : '')
              setCount(null)
            }}
            className={fieldClass}
          >
            <option value="">Choose a group...</option>
            {groups.map(g => (
              <option key={g.group_id} value={g.group_id}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Minimum public posts">
          <input
            type="number"
            min="0"
            value={minPosts}
            onChange={e => {
              setMinPosts(e.target.value)
              setCount(null)
            }}
            className={fieldClass}
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr] lg:items-stretch">
        <button
          onClick={analyze}
          disabled={!selectedGroupId || loading}
          className="btn-primary h-11 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze Group'}
        </button>

        <ResultDisplay
          label="Qualified members"
          value={count}
          sublabel={selectedGroup ? `${selectedGroup.name} (>= ${minPosts} posts)` : 'Choose a group and threshold'}
        />
      </div>
    </PageCard>
  )
}

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
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold leading-tight text-fb-text">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-fb-text-2">
            Stored function results for profile, post, and group analysis.
          </p>
        </div>
        <div className="inline-flex w-fit items-center rounded-full border border-fb-gray-2 bg-white px-3 py-1 text-xs font-semibold text-fb-text-2">
          Read-only database queries
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl bg-white py-20 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-fb-blue border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <MutualFriendsSection users={users} />
          <ReactionScoreSection />
          <GroupAnalyticsSection />
        </div>
      )}
    </div>
  )
}
