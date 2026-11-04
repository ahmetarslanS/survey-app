import { cn } from '@/lib/utils'

export function Brand({ inverted = false, className }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'grid size-8 place-items-center rounded-lg font-bold',
          inverted ? 'bg-white text-primary' : 'bg-primary text-white',
        )}
      >
        S
      </div>
      <div>
        <b className="block text-sm leading-tight font-semibold">Survey Tool</b>
        <small className={cn('text-[10px]', inverted ? 'text-[#C7D5FA]' : 'text-subtle')}>DefineX</small>
      </div>
    </div>
  )
}
