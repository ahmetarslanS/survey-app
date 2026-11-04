import { Label } from '@/components/shadcnui/label'
import { cn } from '@/lib/utils'

export function FormField({ label, htmlFor, error, hint, className, children }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-[13px] text-destructive">{error}</p>}
    </div>
  )
}
