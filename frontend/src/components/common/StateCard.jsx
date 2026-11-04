import { Card } from '@/components/shadcnui/card'
import { cn } from '@/lib/utils'

const TONES = {
  success: 'bg-success-soft text-success ring-[#F6FEF9]',
  warning: 'bg-warning-soft text-warning ring-[#FFFCF5]',
  primary: 'bg-accent text-primary ring-transparent',
  danger: 'bg-destructive-soft text-destructive ring-[#FFFBFA]',
}

/** Ortalanmış ikon + başlık + açıklama kartı (teşekkür, erişim hatası, boş durumlar) */
export function StateCard({ icon: Icon, tone = 'primary', title, children, actions, className }) {
  return (
    <Card className={cn('items-center px-7 py-11 text-center', className)}>
      <div className={cn('grid size-14 place-items-center rounded-full ring-8', TONES[tone])}>
        <Icon className="size-7" />
      </div>
      <h2 className="mt-6 mb-2 text-xl font-semibold">{title}</h2>
      {children && <p className="mx-auto max-w-[420px] leading-relaxed text-muted-foreground">{children}</p>}
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-2.5">{actions}</div>}
    </Card>
  )
}
