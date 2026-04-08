import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { GROUPS, getUserGroups, getGroupMembers, type Group } from '../data/mockData.ts'

export default function GroupsPage() {
  const { user } = useAuth()
  const myGroups    = getUserGroups(user?.user_id ?? 0)
  const otherGroups = GROUPS.filter(g => !myGroups.find(mg => mg.group_id === g.group_id))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <section>
        <h2 className="font-bold text-xl mb-3">Nhóm của bạn</h2>
        {myGroups.length === 0 ? (
          <div className="card p-8 text-center text-fb-text-2 text-sm">Bạn chưa tham gia nhóm nào.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myGroups.map(g => <GroupCard key={g.group_id} group={g} joined />)}
          </div>
        )}
      </section>

      {otherGroups.length > 0 && (
        <section>
          <h2 className="font-bold text-xl mb-3">Khám phá nhóm</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {otherGroups.map(g => <GroupCard key={g.group_id} group={g} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function GroupCard({ group, joined = false }: { group: Group; joined?: boolean }) {
  const memberCount = getGroupMembers(group.group_id).length
  return (
    <div className="card overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/groups/${group.group_id}`}>
        <div className="h-32 bg-gradient-to-br from-purple-500 to-fb-blue relative">
          {group.cover_url && (
            <img src={group.cover_url} alt="" className="w-full h-full object-cover" />
          )}
          <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full
            ${group.privacy === 'PRIVATE' ? 'bg-black/50 text-white' : 'bg-white/80 text-fb-text'}`}>
            {group.privacy === 'PRIVATE' ? '🔒 Riêng tư' : '🌐 Công khai'}
          </span>
        </div>
      </Link>
      <div className="p-3 space-y-2">
        <Link to={`/groups/${group.group_id}`} className="font-semibold hover:underline block">{group.name}</Link>
        <p className="text-fb-text-2 text-xs">{memberCount} thành viên</p>
        {group.description && <p className="text-sm text-fb-text-2 line-clamp-2">{group.description}</p>}
        {joined ? (
          <Link to={`/groups/${group.group_id}`}
            className="block w-full btn-secondary text-sm text-center py-1.5">
            Xem nhóm
          </Link>
        ) : (
          <button className="w-full bg-fb-blue hover:bg-fb-blue-dark text-white text-sm font-semibold py-1.5 rounded-lg transition-colors">
            + Tham gia nhóm
          </button>
        )}
      </div>
    </div>
  )
}
