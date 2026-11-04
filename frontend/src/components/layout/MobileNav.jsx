import { LogOut } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'

import { Button } from '@/components/shadcnui/button'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

import { Brand } from '../common/Brand'
import { NAV_GROUPS } from './nav-items'

/** 768px altında kenar çubuğunun yerine geçen üst çubuk */
export function MobileNav() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const items = NAV_GROUPS.flatMap((g) => g.items)

  return (
    <header className="sticky top-0 z-40 border-b bg-sidebar md:hidden">
      <div className="flex items-center justify-between px-4 py-2.5">
        <Brand />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Çıkış yap"
          onClick={() => {
            logout()
            navigate('/login', { replace: true })
          }}
        >
          <LogOut />
        </Button>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
        {items.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'rounded-lg px-3 py-1.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground',
                isActive && 'bg-accent text-primary',
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
