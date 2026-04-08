import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar.tsx'
import LeftSidebar from '../components/LeftSidebar.tsx'
import RightSidebar from '../components/RightSidebar.tsx'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-fb-gray">
      <Navbar />
      <div className="max-w-screen-xl mx-auto flex gap-4 pt-16 px-2">
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-16 pt-4">
            <LeftSidebar />
          </div>
        </aside>
        <main className="flex-1 min-w-0 py-4">
          <Outlet />
        </main>
        <aside className="hidden xl:block w-80 flex-shrink-0">
          <div className="sticky top-16 pt-4">
            <RightSidebar />
          </div>
        </aside>
      </div>
    </div>
  )
}
