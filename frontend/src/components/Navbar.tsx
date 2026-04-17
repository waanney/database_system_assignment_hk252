import { useState, type SVGProps, type FC } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.tsx'
import { getAvatar } from '../data/mockData.ts'

type IconComponent = FC<SVGProps<SVGSVGElement>>

interface NavItem {
  path:  string
  label: string
  icon:  IconComponent
}

const NAV_ITEMS: NavItem[] = [
  { path: '/',        label: 'Trang chủ', icon: HomeIcon   },
  { path: '/friends', label: 'Bạn bè',    icon: PeopleIcon },
  { path: '/groups',  label: 'Nhóm',      icon: GroupIcon  },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white shadow-sm h-14 flex items-center px-4">
      {/* Logo */}
      <Link to="/" className="flex-shrink-0 flex items-center">
        <div className="w-10 h-10 bg-fb-blue rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-2xl leading-none" style={{ fontFamily: 'Georgia, serif' }}>f</span>
        </div>
      </Link>

      {/* Search */}
      <div className="ml-2 flex-shrink-0">
        <div className="flex items-center bg-fb-gray rounded-full px-3 py-2 gap-2 w-52">
          <SearchIcon className="w-4 h-4 text-fb-text-2" />
          <input
            className="bg-transparent text-sm outline-none w-full placeholder:text-fb-text-2"
            placeholder="Tìm kiếm trên Facebook"
          />
        </div>
      </div>

      {/* Nav tabs */}
      <nav className="flex-1 flex justify-center gap-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              title={label}
              className={`px-8 py-1 rounded-lg flex items-center justify-center border-b-4 transition-colors
                ${active
                  ? 'border-fb-blue text-fb-blue'
                  : 'border-transparent text-fb-text-2 hover:bg-fb-gray-2'}`}
            >
              <Icon className="w-6 h-6" />
            </Link>
          )
        })}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2 relative">
        <Link to={`/profile/${user?.user_id}`}>
          <img
            src={getAvatar(user?.user_id ?? 0)}
            alt={user?.first_name}
            className="w-9 h-9 rounded-full object-cover cursor-pointer hover:opacity-90"
          />
        </Link>
        <button onClick={() => setMenuOpen(o => !o)} className="icon-btn">
          <ChevronIcon className="w-5 h-5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-lg border border-fb-gray-2 overflow-hidden z-50">
            <Link
              to={`/profile/${user?.user_id}`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-fb-gray transition-colors"
            >
              <img src={getAvatar(user?.user_id ?? 0)} className="w-8 h-8 rounded-full object-cover" />
              <div>
                <p className="font-semibold text-sm">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-fb-text-2">Xem trang cá nhân</p>
              </div>
            </Link>
            <hr className="border-fb-gray-2 mx-4" />
            <div className="px-4 py-2">
              <p className="text-xs font-semibold text-fb-text-2 uppercase tracking-wide mb-1">Quản trị</p>
            </div>
            <Link
              to="/users"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-fb-gray transition-colors"
            >
              <div className="w-8 h-8 bg-fb-gray-2 rounded-full flex items-center justify-center">
                <PeopleIcon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Quản lý người dùng</span>
            </Link>
            <Link
              to="/admin/users"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-fb-gray transition-colors"
            >
              <div className="w-8 h-8 bg-fb-gray-2 rounded-full flex items-center justify-center">
                <ShieldIcon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Quản trị người dùng</span>
            </Link>
            <Link
              to="/analytics"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-fb-gray transition-colors"
            >
              <div className="w-8 h-8 bg-fb-gray-2 rounded-full flex items-center justify-center">
                <ChartIcon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Phân tích</span>
            </Link>
            <hr className="border-fb-gray-2 mx-4" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-fb-gray transition-colors text-left"
            >
              <div className="w-8 h-8 bg-fb-gray-2 rounded-full flex items-center justify-center">
                <LogoutIcon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Đăng xuất</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  )
}
function PeopleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  )
}

function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
    </svg>
  )
}

function ChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
    </svg>
  )
}
function GroupIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
    </svg>
  )
}
function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  )
}
function ChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M7 10l5 5 5-5z" />
    </svg>
  )
}
function LogoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
    </svg>
  )
}
