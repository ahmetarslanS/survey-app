import { Card } from '@/components/shadcnui/card'
import { cn } from '@/lib/utils'

export function KpiCard({ icon: Icon, label, value, hint, hero = false }) {
  return (
    <Card className={cn('p-[18px]', hero && 'border-primary bg-primary text-white')}>
      <span className={cn('flex items-center gap-2 text-[13px]', hero ? 'text-[#C7D5FA]' : 'text-muted-foreground')}>
        <Icon className="size-4" />
        {label}
      </span>
      <b className="mt-2.5 block text-[28px] font-bold tracking-tight">{value}</b>
      {hint && <small className={cn('font-medium', hero ? 'text-[#C7D5FA]' : 'text-muted-foreground')}>{hint}</small>}
    </Card>
  )
}
