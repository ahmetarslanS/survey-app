import { Checkbox } from '@/components/shadcnui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/shadcnui/radio-group'
import { Textarea } from '@/components/shadcnui/textarea'
import { cn } from '@/lib/utils'

const choiceClass = (on) =>
  cn(
    'flex cursor-pointer items-center gap-3 rounded-[10px] border px-3.5 py-3 transition-colors hover:border-[#B8C7F3] hover:bg-[#FAFBFF]',
    on && 'border-primary bg-accent hover:border-primary hover:bg-accent',
  )

/**
 * Katılımcı formundaki tek bir sorunun girdisi.
 * value: LIKERT/SINGLE_CHOICE -> seçilen option.order, MULTIPLE_CHOICE -> order dizisi, FREETEXT -> metin
 */
export function QuestionInput({ question, value, onChange }) {
  const { type, options } = question

  if (type === 'LIKERT') {
    return (
      <RadioGroup
        aria-label={question.text}
        value={value != null ? String(value) : ''}
        onValueChange={(v) => onChange(Number(v))}
        className="mt-5 grid-cols-1 gap-2 sm:grid-cols-5"
      >
        {options.map((o) => (
          <label key={o.order} className={cn(choiceClass(value === o.order), 'sm:flex-col sm:gap-2 sm:px-1.5 sm:py-3.5 sm:text-center sm:text-xs')}>
            <RadioGroupItem value={String(o.order)} />
            {o.text}
          </label>
        ))}
      </RadioGroup>
    )
  }

  if (type === 'SINGLE_CHOICE') {
    return (
      <RadioGroup
        aria-label={question.text}
        value={value != null ? String(value) : ''}
        onValueChange={(v) => onChange(Number(v))}
        className="mt-5 gap-2.5"
      >
        {options.map((o) => (
          <label key={o.order} className={choiceClass(value === o.order)}>
            <RadioGroupItem value={String(o.order)} />
            {o.text}
          </label>
        ))}
      </RadioGroup>
    )
  }

  if (type === 'MULTIPLE_CHOICE') {
    const selected = value ?? []
    const toggle = (order, checked) =>
      onChange(checked ? [...selected, order] : selected.filter((x) => x !== order))
    return (
      <div className="mt-5 flex flex-col gap-2.5">
        {options.map((o) => (
          <label key={o.order} className={choiceClass(selected.includes(o.order))}>
            <Checkbox checked={selected.includes(o.order)} onCheckedChange={(c) => toggle(o.order, Boolean(c))} />
            {o.text}
          </label>
        ))}
        <small className="text-muted-foreground">Birden fazla seçebilirsiniz</small>
      </div>
    )
  }

  return (
    <Textarea
      aria-label={question.text}
      className="mt-5 min-h-[130px]"
      placeholder="Yanıtınızı yazın..."
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
