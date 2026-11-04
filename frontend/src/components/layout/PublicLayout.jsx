import { Lock } from 'lucide-react'
import { Outlet } from 'react-router-dom'

import { Brand } from '../common/Brand'

/** Katılımcıya açık sayfalar (oturum gerektirmez) */
export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-2.5 border-b bg-card px-6 py-3.5">
        <Brand />
        <span className="ml-auto flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Lock className="size-4" />
          Güvenli bağlantı
        </span>
      </header>
      <div className="mx-auto max-w-[680px] px-4 pt-9 pb-24">
        <Outlet />
      </div>
    </div>
  )
}
