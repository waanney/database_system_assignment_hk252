import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.tsx'
import { reportApi, getErrorMessage } from '../services/api'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  REVIEWED: 'bg-blue-100 text-blue-800',
  ACTION_TAKEN: 'bg-green-100 text-green-800',
  DISMISSED: 'bg-gray-100 text-gray-800',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  REVIEWED: 'Đã xem',
  ACTION_TAKEN: 'Đã hành động',
  DISMISSED: 'Bỏ qua',
}

function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error'; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white ${type === 'success' ? 'bg-fb-green' : 'bg-red-500'}`}>
      <span>{type === 'success' ? '✓' : '✕'}</span>
      <span className="font-medium">{message}</span>
      <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
    </div>
  )
}

interface ReportDetailModalProps {
  report: any
  onClose: () => void
  onAction: (status: string) => void
  loading: boolean
}

function ReportDetailModal({ report, onClose, onAction, loading }: ReportDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-fb-blue px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Chi tiết báo cáo #{report.report_id}</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-fb-text-2">Trạng thái</p>
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[report.status] ?? 'bg-gray-100 text-gray-800'}`}>
              {STATUS_LABELS[report.status] ?? report.status}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-fb-text-2">Người báo cáo (user_id: {report.user_id})</p>
            <p className="text-fb-text">{report.reporter_email || `User #${report.user_id}`}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-fb-text-2">Bài viết bị báo cáo (post_id: {report.post_id})</p>
            <p className="text-fb-text bg-fb-gray rounded-lg p-3 text-sm italic">
              {report.post_content ? `"${report.post_content}"` : '(Không có nội dung)'}
            </p>
          </div>
          {report.reason && (
            <div>
              <p className="text-sm font-medium text-fb-text-2">Lý do</p>
              <p className="text-fb-text">{report.reason}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-fb-text-2">Ngày tạo</p>
            <p className="text-fb-text">{new Date(report.created_at).toLocaleString()}</p>
          </div>

          {report.status === 'PENDING' && (
            <div className="flex gap-3 pt-2 border-t border-fb-gray-2">
              <button
                onClick={() => onAction('REVIEWED')}
                disabled={loading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Đánh dấu đã xem'}
              </button>
              <button
                onClick={() => onAction('ACTION_TAKEN')}
                disabled={loading}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Hành động'}
              </button>
              <button
                onClick={() => onAction('DISMISSED')}
                disabled={loading}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Bỏ qua'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const isAdmin = user?.is_admin === true

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }, [])

  async function fetchReports() {
    setLoading(true)
    try {
      const res = await reportApi.list(statusFilter || undefined)
      setReports(res.data)
    } catch (err: any) {
      if (err.message?.includes('Admin')) {
        showToast('Chỉ quản trị viên mới có thể xem báo cáo.', 'error')
      } else {
        showToast(getErrorMessage(err), 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [statusFilter])

  async function handleAction(reportId: number, newStatus: string) {
    setActionLoading(true)
    try {
      await reportApi.update(reportId, newStatus)
      showToast(`Báo cáo #${reportId} đã được cập nhật thành "${STATUS_LABELS[newStatus]}".`, 'success')
      setSelectedReport(null)
      await fetchReports()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredReports = reports

  return (
    <div className="max-w-5xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onAction={(status) => handleAction(selectedReport.report_id, status)}
          loading={actionLoading}
        />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-fb-text">Quản lý báo cáo</h1>
        <p className="text-fb-text-2 text-sm mt-1">Xem và xử lý các báo cáo từ người dùng</p>
      </div>

      {!isAdmin && (
        <div className="card p-6 text-center text-red-500">
          Chỉ quản trị viên mới có thể truy cập trang này.
        </div>
      )}

      {isAdmin && (
        <>
          <div className="flex gap-2 mb-4">
            {['', 'PENDING', 'REVIEWED', 'ACTION_TAKEN', 'DISMISSED'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  statusFilter === s
                    ? 'bg-fb-blue text-white'
                    : 'bg-fb-gray hover:bg-fb-gray-2 text-fb-text-2'
                }`}
              >
                {s === '' ? 'Tất cả' : STATUS_LABELS[s] ?? s}
              </button>
            ))}
          </div>

          <div className="card overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-fb-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-fb-text-2">
                <svg className="w-16 h-16 mb-3 text-fb-gray-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Không có báo cáo nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-fb-gray-2 bg-fb-gray">
                      <th className="text-left px-4 py-3 font-semibold text-fb-text-2">ID</th>
                      <th className="text-left px-4 py-3 font-semibold text-fb-text-2">Người báo cáo</th>
                      <th className="text-left px-4 py-3 font-semibold text-fb-text-2">Post ID</th>
                      <th className="text-left px-4 py-3 font-semibold text-fb-text-2">Lý do</th>
                      <th className="text-left px-4 py-3 font-semibold text-fb-text-2">Trạng thái</th>
                      <th className="text-left px-4 py-3 font-semibold text-fb-text-2">Ngày</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map(report => (
                      <tr
                        key={report.report_id}
                        className="border-b border-fb-gray-2 hover:bg-fb-gray/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedReport(report)}
                      >
                        <td className="px-4 py-3 text-fb-text-2">#{report.report_id}</td>
                        <td className="px-4 py-3 font-medium text-fb-text">User #{report.user_id}</td>
                        <td className="px-4 py-3 text-fb-text">Post #{report.post_id}</td>
                        <td className="px-4 py-3 text-fb-text-2 max-w-xs truncate">
                          {report.reason || '(Không có)'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[report.status] ?? 'bg-gray-100 text-gray-800'}`}>
                            {STATUS_LABELS[report.status] ?? report.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-fb-text-2 text-xs">
                          {new Date(report.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
