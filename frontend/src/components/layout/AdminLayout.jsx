import { Outlet } from 'react-router-dom'

import { TooltipProvider } from '@/components/shadcnui/tooltip'

import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'

export function AdminLayout() {
  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <MobileNav />
        <main className="min-w-0 flex-1 px-4 py-6 md:px-7 md:pb-16">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  )
}
