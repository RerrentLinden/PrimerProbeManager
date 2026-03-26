import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import MobileHeader from './MobileHeader'

export default function AppLayout() {
  return (
    <div className="min-h-screen flex bg-lab-bg">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-h-screen">
        <MobileHeader />
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto bg-lab-bg">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
