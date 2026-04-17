import { useState, useEffect, useCallback } from 'react'
import { userApi, type User, type UserFormData, type Gender } from '../services/api'

// ─── Toast State Type ─────────────────────────────────────────────────────────

type ToastType = 'success' | 'error'

interface ToastState {
  message: string
  type: ToastType
}

// ─── Validation ─────────────────────────────────────────────────────────────

function validateUser(form: UserFormData): string | null {
  if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return 'Invalid email.'
  if (!form.first_name.trim()) return 'First name is required.'
  if (!form.last_name.trim()) return 'Last name is required.'
  if (form.date_of_birth) {
    const age = new Date().getFullYear() - new Date(form.date_of_birth).getFullYear()
    if (age < 18) return 'User must be at least 18 years old.'
  }
  return null
}

// ─── User Form Modal ────────────────────────────────────────────────────────

interface UserFormModalProps {
  user?: User | null
  onClose: () => void
  onSuccess: (message: string) => void
  onError?: (message: string) => void
}

function UserFormModal({ user, onClose, onSuccess, onError: _onError }: UserFormModalProps) {
  const [form, setForm] = useState<UserFormData>({
    email: user?.email ?? '',
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    phone_number: user?.phone_number ?? '',
    date_of_birth: user?.date_of_birth ?? '',
    gender: (user?.gender as Gender) ?? 'UNSPECIFIED',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const isEdit = Boolean(user)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateUser(form)
    if (err) { setValidationError(err); return }
    setValidationError(null)
    setLoading(true)
    try {
      if (isEdit) {
        await userApi.update(user!.user_id, form)
        onSuccess('User updated successfully.')
      } else {
        await userApi.create(form)
        onSuccess('User created successfully.')
      }
      onClose()
    } catch (err: any) {
      setValidationError(err.message || 'Operation failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-fb-blue px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">
            {isEdit ? 'Edit User' : 'Create New User'}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {validationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {validationError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-fb-text-2 mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-fb-text-2 mb-1">First Name *</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-fb-text-2 mb-1">Last Name *</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-fb-text-2 mb-1">Phone Number</label>
            <input
              type="tel"
              value={form.phone_number ?? ''}
              onChange={(e) => setForm(f => ({ ...f, phone_number: e.target.value }))}
              className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-fb-text-2 mb-1">Date of Birth</label>
              <input
                type="date"
                value={form.date_of_birth ?? ''}
                onChange={(e) => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-fb-text-2 mb-1">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm(f => ({ ...f, gender: e.target.value as Gender }))}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue bg-white"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="UNSPECIFIED">Unspecified</option>
              </select>
            </div>
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-fb-text-2 mb-1">Password</label>
              <input
                type="password"
                value={form.password ?? ''}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full border border-fb-gray-3 rounded-lg px-3 py-2 focus:outline-none focus:border-fb-blue"
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? 'Processing…' : isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirmation Dialog ─────────────────────────────────────────────

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
          <h2 className="text-white font-semibold text-lg">Confirm Deletion</h2>
        </div>
        <div className="p-6">
          <p className="text-fb-text mb-1">
            Are you sure you want to delete user
          </p>
          <p className="font-semibold text-fb-text mb-1">
            {user.first_name} {user.last_name}
          </p>
          <p className="text-fb-text-2 text-sm">({user.email})</p>
          <p className="text-red-600 text-sm mt-3">This action cannot be undone.</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              try { await userApi.delete(user.user_id); onClose() }
              catch { onClose() }
            }}
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

// ─── Toast Notification ─────────────────────────────────────────────────────

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onDismiss: () => void
}

function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white transition-all ${
      type === 'success' ? 'bg-fb-green' : 'bg-red-500'
    }`}>
      <span>{type === 'success' ? '✓' : '✕'}</span>
      <span className="font-medium">{message}</span>
      <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await userApi.getAll()
      setUsers(res.data)
    } catch (err: any) {
      showToast(err.message || 'Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { loadUsers() }, [loadUsers])

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

  const handleModalClose = () => {
    setShowModal(false)
    setEditingUser(null)
  }

  const handleModalSuccess = (message: string) => {
    showToast(message, 'success')
    loadUsers()
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-fb-text">User Management</h1>
          <p className="text-fb-text-2 text-sm mt-1">Manage all registered users</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-fb-green hover:bg-green-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <span className="text-lg leading-none">+</span>
          Add User
        </button>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-fb-gray-2 bg-fb-gray">
                  <th className="text-left px-4 py-3 font-semibold text-fb-text-2">ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-fb-text-2">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-fb-text-2">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-fb-text-2">Gender</th>
                  <th className="text-left px-4 py-3 font-semibold text-fb-text-2">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-fb-text-2">Role</th>
                  <th className="text-right px-4 py-3 font-semibold text-fb-text-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id} className="border-b border-fb-gray-2 hover:bg-fb-gray/50 transition-colors">
                    <td className="px-4 py-3 text-fb-text-2">#{user.user_id}</td>
                    <td className="px-4 py-3 font-medium text-fb-text">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="px-4 py-3 text-fb-text">{user.email}</td>
                    <td className="px-4 py-3 text-fb-text-2 capitalize">{user.gender.toLowerCase()}</td>
                    <td className="px-4 py-3">
                      {user.is_active
                        ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />Active
                          </span>
                        : <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />Inactive
                          </span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      {user.is_admin
                        ? <span className="inline-flex items-center text-xs font-semibold text-fb-blue">Admin</span>
                        : <span className="text-xs text-fb-text-2">User</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingUser(user); setShowModal(true) }}
                          className="p-1.5 rounded-lg hover:bg-fb-blue/10 text-fb-blue transition-colors"
                          title="Edit user"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          title="Delete user"
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
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <UserFormModal
          user={editingUser}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  )
}