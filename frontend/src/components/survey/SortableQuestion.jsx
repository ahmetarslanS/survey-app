import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Copy, GripVertical, Pencil, Trash2 } from 'lucide-react'

import { IconButton } from '@/components/common/IconButton'
import { QuestionTypeChip } from '@/components/common/QuestionTypeChip'
import { cn } from '@/lib/utils'

/** Sürüklenebilir soru kartı (FR-23, FR-24) */
export function SortableQuestion({ question, number, onEdit, onCopy, onDelete }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'mb-2.5 flex items-center gap-3 rounded-[10px] border bg-card py-3 pr-3 pl-1.5 transition-shadow hover:shadow-md',
        isDragging && 'relative z-10 opacity-60 shadow-lg',
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label="Sıralamak için sürükle"
        className="cursor-grab touch-none p-1 text-subtle active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="grid size-[26px] shrink-0 place-items-center rounded-[7px] bg-secondary text-xs font-semibold text-[#475467]">
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">
          {question.text}
          {question.mandatory && <span className="ml-0.5 text-destructive">*</span>}
        </div>
        {question.options?.length > 0 && <small className="text-xs text-muted-foreground">{question.options.length} seçenek</small>}
      </div>
      <QuestionTypeChip type={question.type} />
      <IconButton icon={Pencil} label="Düzenle" onClick={onEdit} />
      <IconButton icon={Copy} label="Kopyala" onClick={onCopy} />
      <IconButton icon={Trash2} label="Sil" danger onClick={onDelete} />
    </div>
  )
}
