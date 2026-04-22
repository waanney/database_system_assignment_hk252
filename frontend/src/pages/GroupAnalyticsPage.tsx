import { useState, useEffect, useCallback } from 'react'
import { queryApi, groupApi, type Group } from '../services/api'

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info'

interface ToastState {
  message: string
  type: ToastType
}

function Toast({ message, type, onDismiss }: { message: string; type: ToastType; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  const bg = { success: 'bg-fb-green', error: 'bg-red-500', info: 'bg-fb-blue' }[type]
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white transition-all ${bg}`}>
      <span>{type === 'success' ? '\u2713' : type === 'error' ? '\u2715' : '\u2139'}</span>
      <span className="font-medium">{message}</span>
      <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
    </div>
  )
}

// ─── Card ────────────────────────────────────────────────────────────────────

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

// ─── Section 1: Verified Groups via stored procedure ───────────────────────────

function VerifiedGroupsSection() {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState | null>(null)

  const show = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type })
  }, [])

  useEffect(() => {
    // Calls stored procedure: count_ver_group()
    queryApi.getVerifiedGroups()
      .then(res => setGroups(res.data))
      .catch((err: any) => show(err.message || 'Failed to load.', 'error'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card
      title="Verified Groups"
      description="Groups with verified members, sorted by member count (stored procedure)"
      icon={
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
      }
    >
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-3 border-fb-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <p className="text-sm text-fb-text-2 text-center py-6">No verified groups found.</p>
      ) : (
        <div className="space-y-3">
          {groups.map((g, idx) => (
            <div key={g.group_id} className="flex items-center justify-between p-4 bg-fb-gray rounded-xl">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-fb-blue text-white text-xs font-bold">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-semibold text-fb-text">{g.group_name || g.name}</p>
                  <p className="text-xs text-fb-text-2">ID: {g.group_id}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-fb-blue">{g.member_count}</p>
                <p className="text-xs text-fb-text-2">verified members</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── Section 2: Group Search via stored procedure ─────────────────────────────

function GroupSearchSection() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Group[]>([])
  const [allGroups, setAllGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const show = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type })
  }, [])

  useEffect(() => {
    groupApi.list({ limit: 100 })
      .then(res => setAllGroups(res.data))
      .catch((err: any) => show(err.message || 'Failed to load groups.', 'error'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await groupApi.list({ limit: 100 })
        const term = searchTerm.toLowerCase()
        const filtered = (res.data as Group[]).filter(g =>
          g.name.toLowerCase().includes(term) ||
          (g.description && g.description.toLowerCase().includes(term))
        )
        setSearchResults(filtered)
      } catch (err: any) {
        show(err.message || 'Search failed.', 'error')
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const displayGroups = searchTerm.trim() ? searchResults : allGroups

  return (
    <Card
      title="Browse Groups"
      description="Search and explore all groups (stored procedure)"
      icon={
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.937-1.542m-2.016 2.016l-.52.52a10.003 10.003 0 01-3.477 3.477m1.477-1.477a10 10 0 013.477-3.477m.52-.52l-.52.52m0 0a9 9 0 01-12.733 0" />
        </svg>
      }
    >
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div className="relative mb-4">
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

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-3 border-fb-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayGroups.length === 0 ? (
        <p className="text-sm text-fb-text-2 text-center py-6">
          {searchTerm.trim() ? `No groups found matching "${searchTerm}".` : 'No groups available.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayGroups.map(g => (
            <a
              key={g.group_id}
              href={`/groups/${g.group_id}`}
              className="block p-4 bg-fb-gray rounded-xl hover:bg-fb-gray-2 transition-colors"
            >
              <p className="font-semibold text-fb-text truncate">{g.name}</p>
              {g.description && (
                <p className="text-xs text-fb-text-2 mt-1 line-clamp-2">{g.description}</p>
              )}
              <p className="text-xs text-fb-text-2 mt-2">
                {g.member_count ?? 0} members
              </p>
            </a>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GroupAnalyticsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-fb-text">Group Analytics</h1>
        <p className="text-fb-text-2 text-sm mt-1">
          Group insights using stored procedures and functions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VerifiedGroupsSection />
        <GroupSearchSection />
      </div>
    </div>
  )
}
