import { Lock, Mail, Monitor } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Brand } from '@/components/common/Brand'
import { FormField } from '@/components/common/FormField'
import { Alert, AlertDescription } from '@/components/shadcnui/alert'
import { Button } from '@/components/shadcnui/button'
import { Checkbox } from '@/components/shadcnui/checkbox'
import { Input } from '@/components/shadcnui/input'
import { Label } from '@/components/shadcnui/label'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname ?? '/surveys'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to={redirectTo} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError('E-posta ve şifre zorunludur.')
      return
    }
    setSubmitting(true)
    try {
      await login(email.trim(), password, remember)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      // 401: genel mesaj (FR-01) · 423: hesap kilitli · 0: sunucuya ulaşılamadı
      setError(err.status === 423 || err.status === 0 ? err.message : 'E-posta veya şifre hatalı.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-white md:flex">
        <Brand inverted />
        <div>
          <h2 className="max-w-[420px] text-3xl leading-tight font-bold">
            Anketlerinizi dakikalar içinde hazırlayın, güvenle dağıtın.
          </h2>
          <p className="mt-4 max-w-[400px] leading-relaxed text-[#C7D5FA]">
            Kurum içi ve kurum dışı anketler için kişiye özel linkler, anlık katılım takibi ve tek tıkla raporlama.
          </p>
        </div>
        <small className="text-[#C7D5FA]">© 2026 DefineX</small>
        <div className="pointer-events-none absolute -right-28 -bottom-28 size-[420px] rounded-full border-[60px] border-white/10" />
      </div>

      <div className="grid place-items-center bg-card p-6">
        <form onSubmit={handleSubmit} className="flex w-[360px] max-w-full flex-col gap-4" noValidate>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Giriş Yap</h1>
            <p className="mt-1.5 text-muted-foreground">Admin hesabınızla devam edin.</p>
          </div>

          <Button type="button" variant="outline" onClick={() => toast.info('Kurumsal SSO sonraki fazda eklenecek.')}>
            <Monitor />
            Kurumsal hesapla giriş (SSO)
          </Button>

          <div className="flex items-center gap-2.5 text-xs text-subtle before:flex-1 before:border-t after:flex-1 after:border-t">
            veya
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FormField label="E-posta" htmlFor="email">
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="admin@teamdefinex.com"
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </FormField>

          <FormField label="Şifre" htmlFor="password">
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className="pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </FormField>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
              <Label htmlFor="remember" className="font-normal text-muted-foreground">
                Beni hatırla
              </Label>
            </div>
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => toast.info('Şifre sıfırlama bağlantısı için sistem yöneticinizle iletişime geçin.')}
            >
              Şifremi unuttum
            </button>
          </div>

          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
          </Button>
        </form>
      </div>
    </div>
  )
}
