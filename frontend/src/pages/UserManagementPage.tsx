import { useState, useEffect, useCallback } from 'react'
import { userApi, type User, type Gender } from '../services/api'

// ─── Toast ──────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error'

interface ToastState { message: string; type: ToastType }

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

// ─── Stats Cards ────────────────────────────────────────────────────────────

interface StatsBarProps {
  total: number
  admins: number
  verified: number
  active: number
}

function StatsBar({ total, admins, verified, active }: StatsBarProps) {
  const stats = [
    { label: 'Total Users', value: total, color: 'bg-fb-blue', textColor: 'text-fb-blue' },
    { label: 'Admins', value: admins, color: 'bg-purple-500', textColor: 'text-purple-600' },
    { label: 'Verified', value: verified, color: 'bg-green-500', textColor: 'text-green-600' },
    { label: 'Active', value: active, color: 'bg-fb-green', textColor: 'text-fb-green' },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map(s => (
        <div key={s.label} className="card p-4 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center text-white text-xl font-bold`}>
            {s.value}
          </div>
          <div>
            <p className={`text-2xl font-bold ${s.textColor}`}>{s.value}</p>
            <p className="text-sm text-fb-text-2">{s.label}</p>
          </div>
        </div>
      ))}
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
    first_name: user.first_name ?? '',
    last_name: user.last_name ?? '',
    phone_number: user.phone_number ?? '',
    date_of_birth: user.date_of_birth ?? '',
    gender: (user.gender as Gender) ?? 'UNSPECIFIED',
    is_active: user.is_active ?? true,
    is_verified: user.is_verified ?? false,
  })
  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const validate = (): string | null => {
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return 'Invalid email address.'
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
      await (userApi.update as any)(user.user_id, {
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        is_active: form.is_active,
      })
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
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-fb-blue px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold text-lg">Edit User</h2>
            <p className="text-white/70 text-sm">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          {validationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {validationError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-fb-text-2 mb-1">First Name</label>
              <input type="text" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fb-blue" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-fb-text-2 mb-1">Last Name</label>
              <input type="text" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fb-blue" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-fb-text-2 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fb-blue" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-fb-text-2 mb-1">Phone Number</label>
            <input type="tel" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
              className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fb-blue" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-fb-text-2 mb-1">Date of Birth</label>
              <input type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fb-blue" />
            </div>
            <div>
              <label className="block text-xs font-medium text-fb-text-2 mb-1">Gender</label>
              <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value as Gender }))}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fb-blue bg-white">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="UNSPECIFIED">Unspecified</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="w-4 h-4 accent-fb-blue" />
              <span className="text-sm font-medium text-fb-text">Active Account</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2 border-t border-fb-gray-2">
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

// ─── Delete Dialog ──────────────────────────────────────────────────────────

interface DeleteDialogProps {
  user: User
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}

function DeleteDialog({ user, onClose, onConfirm, loading }: DeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-red-500 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">Delete User</h2>
            <p className="text-white/80 text-sm">This action cannot be undone</p>
          </div>
        </div>
        <div className="p-6">
          <p className="text-fb-text text-sm mb-4">
            Are you sure you want to delete this user? All their posts, comments, and reactions will also be permanently removed.
          </p>
          <div className="bg-fb-gray rounded-xl p-3 flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-fb-blue flex items-center justify-center text-white font-bold text-sm">
              {(user.first_name?.[0] ?? '')}{(user.last_name?.[0] ?? '')}
            </div>
            <div>
              <p className="font-semibold text-sm text-fb-text">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-fb-text-2">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 btn-secondary" disabled={loading}>Cancel</button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Deleting…' : 'Delete User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── User Card ──────────────────────────────────────────────────────────────

interface UserCardProps {
  user: User
  onEdit: (u: User) => void
  onDelete: (u: User) => void
}

function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const displayName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Unknown User'

  const badges = []
  if (user.is_admin) badges.push({ label: 'Admin', color: 'bg-purple-100 text-purple-700' })
  if (user.is_verified) badges.push({ label: 'Verified', color: 'bg-green-100 text-green-700' })
  if (!user.is_active) badges.push({ label: 'Inactive', color: 'bg-gray-100 text-gray-500' })

  return (
    <div className="card p-5 hover:shadow-md transition-shadow flex items-start gap-4">
      <div className="relative flex-shrink-0">
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1877F2&color=fff&size=128`}
          alt={displayName}
          className="w-14 h-14 rounded-full object-cover"
        />
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${user.is_active ? 'bg-fb-green' : 'bg-gray-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-fb-text truncate">{displayName}</p>
            <p className="text-sm text-fb-text-2 truncate">{user.email}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(user)}
              className="p-2 rounded-lg hover:bg-fb-blue/10 text-fb-blue transition-colors"
              title="Edit user"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(user)}
              className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
              title="Delete user"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {badges.map(b => (
            <span key={b.label} className={`px-2 py-0.5 rounded-full text-xs font-semibold ${b.color}`}>
              {b.label}
            </span>
          ))}
          {user.phone_number && (
            <span className="text-xs text-fb-text-2">{user.phone_number}</span>
          )}
          {user.gender && (
            <span className="text-xs text-fb-text-2 capitalize">{user.gender.toLowerCase()}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

const LIMIT = 12

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }, [])

  const clearToast = useCallback(() => setToast(null), [])

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [search])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const offset = (page - 1) * LIMIT
      const res = await userApi.list({ search: debouncedSearch, limit: LIMIT, offset })
      setUsers(res.data.items)
      setTotal(res.data.total)
    } catch (err: any) {
      showToast(err.message || 'Failed to load users.', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, showToast])

  useEffect(() => { loadUsers() }, [loadUsers])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await userApi.delete(deleteTarget.user_id)
      showToast(`User "${deleteTarget.first_name} ${deleteTarget.last_name}" has been deleted.`, 'success')
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
  const admins = users.filter(u => u.is_admin).length
  const verified = users.filter(u => u.is_verified).length
  const active = users.filter(u => u.is_active).length

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-fb-text">User Directory</h1>
        <p className="text-fb-text-2 text-sm mt-1">Manage all user accounts</p>
      </div>

      <StatsBar total={total} admins={admins} verified={verified} active={active} />

      <div className="card mb-6 p-4">
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-fb-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-fb-text-2">
          <svg className="w-16 h-16 mb-4 text-fb-gray-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-lg font-medium">No users found</p>
          <p className="text-sm mt-1">Try adjusting your search query</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {users.map((user) => (
              <UserCard
                key={user.user_id}
                user={user}
                onEdit={setEditingUser}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-fb-text-2">
              Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total} users
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-fb-gray-3 text-sm font-medium text-fb-text hover:bg-fb-gray-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <span className="text-sm font-medium text-fb-text px-2">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-fb-gray-3 text-sm font-medium text-fb-text hover:bg-fb-gray-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}

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
