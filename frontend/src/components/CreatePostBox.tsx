import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext.tsx'

type Visibility = 'PUBLIC' | 'FRIENDS' | 'PRIVATE' | 'CUSTOM'

interface NewPost {
  content: string
  visibility: Visibility
  user_id: number
  group_id?: number | null
}

interface CreatePostBoxProps {
  onPost?: (post: NewPost) => void
  groupId?: number | null
}

function getAvatarUrl(name: string): string {
  const n = name.trim() || 'User'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&background=1877F2&color=fff&size=128`
}

export default function CreatePostBox({ onPost, groupId }: CreatePostBoxProps) {
  const { user } = useAuth()
  const [open,       setOpen]       = useState(false)
  const [content,    setContent]    = useState('')
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!content.trim() || !user) return
    onPost?.({ content: content.trim(), visibility, user_id: user.user_id, group_id: groupId ?? null })
    setContent('')
    setOpen(false)
  }

  const displayName = user?.first_name || 'there'
  const avatarName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'User'

  return (
    <div className="card p-3">
      <div className="flex items-center gap-3">
        <img
          src={getAvatarUrl(avatarName)}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          alt=""
        />
        <button
          onClick={() => setOpen(true)}
          className="flex-1 bg-fb-gray hover:bg-fb-gray-2 text-fb-text-2 text-sm text-left px-4 py-2.5 rounded-full transition-colors"
        >
          {displayName}, what are you thinking?
        </button>
      </div>

      <hr className="border-fb-gray-2 my-3" />

      <div className="flex">
        {[
          { emoji: '🎬', label: 'Live video', color: 'text-red-500' },
          { emoji: '🖼', label: 'Photo/Video', color: 'text-green-500' },
          { emoji: '😎', label: 'Feeling', color: 'text-yellow-500' },
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
              <h3 className="font-bold text-lg">Create Post</h3>
              <button onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-fb-gray-2 flex items-center justify-center text-fb-text-2 hover:bg-fb-gray-3">
                &#x2715;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={getAvatarUrl(avatarName)}
                  className="w-10 h-10 rounded-full object-cover"
                  alt=""
                />
                <div>
                  <p className="font-semibold text-sm">{user?.first_name} {user?.last_name}</p>
                  <select
                    value={visibility}
                    onChange={e => setVisibility(e.target.value as Visibility)}
                    className="text-xs bg-fb-gray-2 rounded px-2 py-0.5 font-semibold outline-none"
                  >
                    <option value="PUBLIC">&#x1f310; Public</option>
                    <option value="FRIENDS">&#x1f465; Friends</option>
                    <option value="PRIVATE">&#x1f512; Only me</option>
                  </select>
                </div>
              </div>

              <textarea
                autoFocus
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={`${displayName}, what's on your mind?`}
                rows={5}
                className="w-full resize-none outline-none text-lg placeholder:text-fb-text-2"
              />

              <button
                type="submit"
                disabled={!content.trim()}
                className="w-full bg-fb-blue hover:bg-fb-blue-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
