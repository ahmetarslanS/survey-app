import { Outlet, ScrollRestoration } from 'react-router-dom'

import { Toaster } from '@/components/shadcnui/sonner'
import { AuthProvider } from '@/context/AuthContext'

/** Veri yönlendiricisinin kök düzeni: oturum bağlamı + bildirimler */
export function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
      <ScrollRestoration />
    </AuthProvider>
  )
}
