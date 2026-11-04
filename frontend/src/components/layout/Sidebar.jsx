import { Bell, ChevronsUpDown, LogOut, Sparkles } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/shadcnui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcnui/dropdown-menu'
import { useAuth } from '@/context/AuthContext'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

import { Brand } from '../common/Brand'
import { NAV_GROUPS } from './nav-items'

const linkClass = ({ isActive }) =>
  cn(
    'relative flex items-center gap-2.5 rounded-lg px-2 py-2 font-medium transition-colors hover:bg-secondary [&_svg]:size-4',
    isActive &&
      'bg-accent text-primary before:absolute before:top-1.5 before:bottom-1.5 before:-left-2 before:w-[3px] before:rounded-sm before:bg-primary',
  )

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 flex-col border-r bg-sidebar px-2 py-2.5 md:flex">
      <Brand className="px-1.5 pt-1 pb-3.5" />
      <nav>
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="px-1.5 pt-3.5 pb-1.5 text-xs text-subtle">{group.title}</div>
            {group.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={linkClass}>
                <Icon />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto">
        <a className="flex items-center gap-2.5 rounded-lg px-2 py-2 font-medium text-muted-foreground [&_svg]:size-4">
          <Sparkles />
          Yenilikler
        </a>
        <a className="flex items-center gap-2.5 rounded-lg px-2 py-2 font-medium text-muted-foreground [&_svg]:size-4">
          <Bell />
          Bildirimler
        </a>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="mt-1.5 flex w-full items-center gap-2.5 rounded-[10px] bg-secondary p-2 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30">
              <Avatar className="size-[30px]">
                <AvatarFallback>{initials(user?.fullName ?? user?.email)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <b className="block truncate text-[13px] font-medium">{user?.fullName ?? 'Admin'}</b>
                <small className="block truncate text-[10px] text-subtle">{user?.email}</small>
              </div>
              <ChevronsUpDown className="size-4 text-subtle" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-[230px]">
            <DropdownMenuItem
              onSelect={() => {
                logout()
                navigate('/login', { replace: true })
              }}
            >
              <LogOut />
              Çıkış yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
