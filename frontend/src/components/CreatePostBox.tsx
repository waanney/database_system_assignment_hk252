import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext.tsx'

interface NewPost {
  content:    string
  visibility: string
  user_id:    number
}

interface CreatePostBoxProps {
  onPost?: (post: NewPost) => void
}

export default function CreatePostBox({ onPost }: CreatePostBoxProps) {
  const { user } = useAuth()
  const [open,       setOpen]       = useState(false)
  const [content,    setContent]    = useState('')
  const [visibility, setVisibility] = useState('PUBLIC')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!content.trim() || !user) return
    onPost?.({ content: content.trim(), visibility, user_id: user.user_id })
    setContent('')
    setOpen(false)
  }

  const fullName = user ? `${user.first_name} ${user.last_name}` : 'User'
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=1877F2&color=fff`

  return (
    <div className="card p-3">
      <div className="flex items-center gap-3">
        <img src={avatarUrl} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        <button
          onClick={() => setOpen(true)}
          className="flex-1 bg-fb-gray hover:bg-fb-gray-2 text-fb-text-2 text-sm text-left px-4 py-2.5 rounded-full transition-colors"
        >
          {user?.first_name} ơi, bạn đang nghĩ gì thế?
        </button>
      </div>

      <hr className="border-fb-gray-2 my-3" />

      <div className="flex">
        {[
          { emoji: '🎬', label: 'Video trực tiếp', color: 'text-red-500' },
          { emoji: '🖼️', label: 'Ảnh/Video',       color: 'text-green-500' },
          { emoji: '😊', label: 'Cảm xúc',         color: 'text-yellow-500' },
        ].map(({ emoji, label, color }) => (
          <button key={label} onClick={() => setOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-1 rounded-lg hover:bg-fb-gray-2 transition-colors text-fb-text-2 text-sm font-semibold">
            <span className={`${color} text-xl`}>{emoji}</span> {label}
          </button>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-fb-gray-2">
              <div className="w-8" />
              <h3 className="font-bold text-lg">Tạo bài viết</h3>
              <button onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-fb-gray-2 flex items-center justify-center text-fb-text-2 hover:bg-fb-gray-3">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img src={avatarUrl} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-sm">{user?.first_name} {user?.last_name}</p>
                  <select
                    value={visibility}
                    onChange={e => setVisibility(e.target.value)}
                    className="text-xs bg-fb-gray-2 rounded px-2 py-0.5 font-semibold outline-none"
                  >
                    <option value="PUBLIC">🌐 Công khai</option>
                    <option value="FRIENDS">👥 Bạn bè</option>
                    <option value="PRIVATE">🔒 Chỉ mình tôi</option>
                  </select>
                </div>
              </div>

              <textarea
                autoFocus
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={`${user?.first_name} ơi, bạn đang nghĩ gì thế?`}
                rows={5}
                className="w-full resize-none outline-none text-lg placeholder:text-fb-text-2"
              />

              <button
                type="submit"
                disabled={!content.trim()}
                className="w-full bg-fb-blue hover:bg-fb-blue-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Đăng
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

