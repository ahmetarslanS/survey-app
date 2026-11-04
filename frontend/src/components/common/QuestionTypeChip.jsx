import { QUESTION_TYPES } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function QuestionTypeChip({ type, className }) {
  const cfg = QUESTION_TYPES[type]
  return (
    <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', cfg?.chip ?? 'bg-secondary', className)}>
      {cfg?.label ?? type}
    </span>
  )
}
