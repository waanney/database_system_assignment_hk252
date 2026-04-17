import { useState, useEffect, useCallback } from 'react'
import { userApi, type User, type Gender } from '../services/api'

// ─── Toast State Type ─────────────────────────────────────────────────────────

type ToastType = 'success' | 'error'

interface ToastState {
  message: string
  type: ToastType
}

// ─── Toast Component ─────────────────────────────────────────────────────────

function Toast({ toast, onDismiss }: { toast: ToastState | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [toast, onDismiss])

  if (!toast) return null

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white transition-all ${
      toast.type === 'success' ? 'bg-fb-green' : 'bg-red-500'
    }`}>
      <span>{toast.type === 'success' ? '✓' : '✕'}</span>
      <span className="font-medium">{toast.message}</span>
      <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
    </div>
  )
}

// ─── Edit Modal ─────────────────────────────────────────────────────────────

interface EditModalProps {
  user: User
  onClose: () => void
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}

function EditModal({ user, onClose, onSuccess, onError }: EditModalProps) {
  const [form, setForm] = useState({
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    phone_number: user.phone_number ?? '',
    date_of_birth: user.date_of_birth ?? '',
    gender: (user.gender as Gender) ?? 'UNSPECIFIED',
  })
  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const validate = (): string | null => {
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return 'Invalid email.'
    if (!form.first_name.trim()) return 'First name is required.'
    if (!form.last_name.trim()) return 'Last name is required.'
    if (form.date_of_birth) {
      const age = new Date().getFullYear() - new Date(form.date_of_birth).getFullYear()
      if (age < 18) return 'User must be at least 18 years old.'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { setValidationError(err); return }
    setValidationError(null)
    setLoading(true)
    try {
      await userApi.update(user.user_id, form)
      onSuccess('User updated successfully.')
      onClose()
    } catch (err: any) {
      onError(err.message || 'Update failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-fb-blue px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Edit User</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {validationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {validationError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-fb-text-2 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-fb-text-2 mb-1">First Name</label>
              <input type="text" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-fb-text-2 mb-1">Last Name</label>
              <input type="text" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-fb-text-2 mb-1">Phone Number</label>
            <input type="tel" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
              className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-fb-text-2 mb-1">Date of Birth</label>
              <input type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-fb-text-2 mb-1">Gender</label>
              <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as Gender }))}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue bg-white">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="UNSPECIFIED">Unspecified</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary" disabled={loading}>Cancel</button>
            <button type="submit" className="flex-1 btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirmation ────────────────────────────────────────────────────

interface DeleteDialogProps {
  user: User
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}

function DeleteDialog({ user, onClose, loading }: DeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-red-500 px-6 py-4">
          <h2 className="text-white font-semibold text-lg">Delete User</h2>
        </div>
        <div className="p-6">
          <p className="text-fb-text">Delete user <strong>{user.first_name} {user.last_name}</strong> ({user.email})?</p>
          <p className="text-red-500 text-sm mt-2">This action cannot be undone.</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 btn-secondary" disabled={loading}>Cancel</button>
          <button
            onClick={async () => { try { await userApi.delete(user.user_id); onClose() } catch { onClose() } }}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            disabled={loading}
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Column Header (Sortable) ───────────────────────────────────────────────

type SortKey = 'name' | 'email' | 'gender' | 'created_at'
type SortDir = 'asc' | 'desc'

interface ColumnHeaderProps {
  label: string
  sortKey: SortKey
  currentKey: SortKey
  direction: SortDir
  onSort: (key: SortKey) => void
}

function ColumnHeader({ label, sortKey, currentKey, direction, onSort }: ColumnHeaderProps) {
  const active = sortKey === currentKey
  return (
    <button
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1.5 font-semibold text-fb-text-2 hover:text-fb-text transition-colors group"
    >
      {label}
      <span className={`transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
        {active && direction === 'asc' ? '↑' : '↓'}
      </span>
    </button>
  )
}

// ─── Pagination Controls ───────────────────────────────────────────────────

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  onPrev: () => void
  onNext: () => void
}

function Pagination({ page, totalPages, total, onPrev, onNext }: PaginationProps) {
  const start = (page - 1) * 10 + 1
  const end = Math.min(page * 10, total)
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-fb-gray-2">
      <span className="text-sm text-fb-text-2">
        Showing {start}–{end} of {total} users
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg border border-fb-gray-3 text-sm font-medium text-fb-text hover:bg-fb-gray-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>
        <span className="text-sm font-medium text-fb-text px-2">
          Page {page} of {totalPages || 1}
        </span>
        <button
          onClick={onNext}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg border border-fb-gray-3 text-sm font-medium text-fb-text hover:bg-fb-gray-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────

const LIMIT = 10

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }, [])

  const clearToast = useCallback(() => {
    setToast(null)
  }, [])

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [search])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const offset = (page - 1) * LIMIT
      const res = await userApi.list({ search: debouncedSearch, limit: LIMIT, offset })
      let data = res.data.items
      // Client-side sort (API should sort, but fallback here)
      data = [...data].sort((a, b) => {
        let cmp = 0
        if (sortKey === 'name') cmp = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
        else if (sortKey === 'email') cmp = a.email.localeCompare(b.email)
        else if (sortKey === 'gender') cmp = a.gender.localeCompare(b.gender)
        return sortDir === 'asc' ? cmp : -cmp
      })
      setUsers(data)
      setTotal(res.data.total)
    } catch (err: any) {
      showToast(err.message || 'Failed to load users.', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, sortKey, sortDir, showToast])

  useEffect(() => { loadUsers() }, [loadUsers])

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await userApi.delete(deleteTarget.user_id)
      showToast('User deleted successfully.', 'success')
      setDeleteTarget(null)
      loadUsers()
    } catch (err: any) {
      showToast(err.message || 'Cannot delete this user.', 'error')
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-fb-text">User Directory</h1>
        <p className="text-fb-text-2 text-sm mt-1">Search, sort and manage user accounts</p>
      </div>

      {/* Search bar */}
      <div className="card mb-4 p-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-fb-gray-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-fb-gray-3 rounded-full bg-fb-gray focus:outline-none focus:border-fb-blue text-fb-text placeholder:text-fb-gray-3"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-fb-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-fb-text-2">
            <svg className="w-16 h-16 mb-3 text-fb-gray-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p>No users match your search.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-fb-gray-2 bg-fb-gray">
                    <th className="text-left px-4 py-3 font-semibold text-fb-text-2 w-12">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-fb-text-2">
                      <ColumnHeader label="Name" sortKey="name" currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-fb-text-2">
                      <ColumnHeader label="Email" sortKey="email" currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-fb-text-2">
                      <ColumnHeader label="Gender" sortKey="gender" currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-fb-text-2">Phone</th>
                    <th className="text-right px-4 py-3 font-semibold text-fb-text-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr key={user.user_id} className="border-b border-fb-gray-2 hover:bg-fb-gray/50 transition-colors">
                      <td className="px-4 py-3 text-fb-text-2">{(page - 1) * LIMIT + idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-fb-text">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-fb-blue flex items-center justify-center text-white text-xs font-bold">
                            {user.first_name[0]}{user.last_name[0]}
                          </div>
                          <div>
                            <div>{user.first_name} {user.last_name}</div>
                            <div className="text-xs text-fb-text-2">
                              {user.is_admin ? 'Admin' : user.is_verified ? 'Verified' : 'Member'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-fb-text">{user.email}</td>
                      <td className="px-4 py-3 text-fb-text-2 capitalize">{user.gender.toLowerCase()}</td>
                      <td className="px-4 py-3 text-fb-text-2">{user.phone_number ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-1.5 rounded-lg hover:bg-fb-blue/10 text-fb-blue transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(user)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              onPrev={() => setPage(p => Math.max(1, p - 1))}
              onNext={() => setPage(p => Math.min(totalPages, p + 1))}
            />
          </>
        )}
      </div>

      {editingUser && (
        <EditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={msg => { showToast(msg, 'success'); loadUsers() }}
          onError={msg => showToast(msg, 'error')}
        />
      )}

      {deleteTarget && (
        <DeleteDialog
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}

      <Toast toast={toast} onDismiss={clearToast} />
    </div>
  )
}