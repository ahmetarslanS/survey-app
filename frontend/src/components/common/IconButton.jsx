import { Button } from '@/components/shadcnui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/shadcnui/tooltip'
import { cn } from '@/lib/utils'

/** Tooltip'li ikon butonu. `danger` true ise üzerine gelince kırmızıya döner. */
export function IconButton({ icon: Icon, label, danger = false, className, ...props }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          className={cn(danger && 'hover:bg-destructive-soft hover:text-destructive', className)}
          {...props}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
