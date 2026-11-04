import { closestCenter, DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2 } from 'lucide-react'

import { IconButton } from '@/components/common/IconButton'
import { Badge } from '@/components/shadcnui/badge'
import { Button } from '@/components/shadcnui/button'
import { Card } from '@/components/shadcnui/card'
import { cn } from '@/lib/utils'

import { SortableQuestion } from './SortableQuestion'

/**
 * Sürüklenebilir bölüm kartı. İçindeki sorular kendi DndContext'i ile bölüm içinde sıralanır.
 * `startNumber`: bu bölümün ilk sorusunun anket genelindeki numarası (numaralar sıra değişince otomatik güncellenir).
 */
export function SortableSection({
  section,
  index,
  startNumber,
  canDelete,
  onRename,
  onDelete,
  onAddQuestion,
  onEditQuestion,
  onCopyQuestion,
  onDeleteQuestion,
  onReorderQuestions,
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  })
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleQuestionDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const from = section.questions.findIndex((q) => q.id === active.id)
    const to = section.questions.findIndex((q) => q.id === over.id)
    onReorderQuestions(arrayMove(section.questions, from, to))
  }

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('mb-4 p-[18px]', isDragging && 'relative z-20 opacity-70 shadow-lg')}
    >
      <div className="mb-3.5 flex items-center gap-2.5">
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label="Bölümü sıralamak için sürükle"
          className="cursor-grab touch-none p-1 text-subtle active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <Badge variant="secondary">Bölüm {index + 1}</Badge>
        <input
          aria-label="Bölüm adı"
          value={section.title}
          onChange={(e) => onRename(e.target.value)}
          className="flex-1 rounded-md bg-transparent px-1.5 py-1 text-[15px] font-semibold outline-none focus:bg-[#F9FAFB]"
        />
        <IconButton icon={Trash2} label="Bölümü sil" danger disabled={!canDelete} onClick={onDelete} />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleQuestionDragEnd}>
        <SortableContext items={section.questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          {section.questions.map((q, i) => (
            <SortableQuestion
              key={q.id}
              question={q}
              number={startNumber + i}
              onEdit={() => onEditQuestion(q)}
              onCopy={() => onCopyQuestion(q)}
              onDelete={() => onDeleteQuestion(q)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {section.questions.length === 0 && (
        <p className="mb-2.5 rounded-[10px] border border-dashed py-5 text-center text-[13px] text-muted-foreground">
          Bu bölümde henüz soru yok.
        </p>
      )}

      <Button
        variant="outline"
        className="w-full justify-center border-dashed border-[#B8C7F3] bg-[#FAFBFF] text-primary shadow-none"
        onClick={onAddQuestion}
      >
        <Plus />
        Yeni Soru
      </Button>
    </Card>
  )
}
