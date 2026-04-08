import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { getAvatar, getUserGroups } from '../data/mockData.ts'

export default function LeftSidebar() {
  const { user } = useAuth()
  const myGroups = getUserGroups(user?.user_id ?? 0)

  return (
    <div className="space-y-1">
      <SideLink to={`/profile/${user?.user_id}`} icon={<img src={getAvatar(user?.user_id ?? 0)} className="w-9 h-9 rounded-full object-cover" />}>
        {user?.first_name} {user?.last_name}
      </SideLink>
      <SideLink to="/friends" icon={<PeopleIcon />}>Bạn bè</SideLink>
      <SideLink to="/groups"  icon={<GroupIcon />}>Nhóm</SideLink>

      <div className="pt-4 border-t border-fb-gray-2 mt-2">
        <p className="text-fb-text-2 font-semibold text-sm px-2 mb-1">Lối tắt của bạn</p>
        {myGroups.map(g => (
          <SideLink
            key={g.group_id}
            to={`/groups/${g.group_id}`}
            icon={
              <div className="w-9 h-9 rounded-lg bg-fb-blue-dark flex items-center justify-center text-white font-bold text-sm">
                {g.name[0]}
              </div>
            }
          >
            {g.name}
          </SideLink>
        ))}
      </div>
    </div>
  )
}

function SideLink({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-fb-gray-2 transition-colors">
      <div className="flex-shrink-0">{icon}</div>
      <span className="font-medium text-sm truncate">{children}</span>
    </Link>
  )
}

function PeopleIcon() {
  return (
    <div className="w-9 h-9 rounded-full bg-fb-blue flex items-center justify-center">
      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    </div>
  )
}

function GroupIcon() {
  return (
    <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center">
      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
      </svg>
    </div>
  )
}
