import { Plus, X } from 'lucide-react'
import { useState } from 'react'

import { FormField } from '@/components/common/FormField'
import { Badge } from '@/components/shadcnui/badge'
import { Button } from '@/components/shadcnui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcnui/dialog'
import { Input } from '@/components/shadcnui/input'
import { Label } from '@/components/shadcnui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcnui/select'
import { Switch } from '@/components/shadcnui/switch'
import { Textarea } from '@/components/shadcnui/textarea'
import { CHOICE_TYPES, LIKERT_LABELS, QUESTION_TYPES } from '@/lib/constants'
import { cn } from '@/lib/utils'

/**
 * S-04: Yeni soru / soru düzenle.
 * `question` null ise yeni soru oluşturulur. Diyalog her açılışta yeniden bağlanmalıdır (key ile).
 */
export function QuestionDialog({ open, onOpenChange, sectionTitle, question, onSave }) {
  const [text, setText] = useState(question?.text ?? '')
  const [type, setType] = useState(question?.type ?? '')
  const [mandatory, setMandatory] = useState(question?.mandatory ?? false)
  const [options, setOptions] = useState(question?.options ?? ['Seçenek 1', 'Seçenek 2'])
  const [errors, setErrors] = useState({})

  const isChoice = CHOICE_TYPES.includes(type)
  const setOption = (i, value) => setOptions((prev) => prev.map((o, k) => (k === i ? value : o)))

  function submit() {
    const next = {}
    if (!text.trim()) next.text = 'Soru metni zorunludur.'
    if (!type) next.type = 'Cevap tipi zorunludur.'
    const cleaned = options.map((o) => o.trim()).filter(Boolean)
    if (isChoice && cleaned.length < 2) next.options = 'Seçimli sorularda en az 2 seçenek gerekir.'
    if (isChoice && new Set(cleaned.map((o) => o.toLowerCase())).size !== cleaned.length)
      next.options = 'Seçenekler birbirinden farklı olmalıdır.'
    setErrors(next)
    if (Object.keys(next).length) return
    onSave({ text: text.trim(), type, mandatory, options: isChoice ? cleaned : [] })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{question ? 'Soruyu Düzenle' : 'Yeni Bir Anket Sorusu Oluşturma'}</DialogTitle>
          <DialogDescription>Bölüm: {sectionTitle}</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <FormField label="Soru" htmlFor="q-text" error={errors.text}>
            <Textarea
              id="q-text"
              placeholder="Soru metnini yazın..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-invalid={Boolean(errors.text)}
            />
          </FormField>

          <FormField label="Cevap Tipi" error={errors.type}>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger aria-label="Cevap tipi" aria-invalid={Boolean(errors.type)}>
                <SelectValue placeholder="Cevap Tipi Seçiniz..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(QUESTION_TYPES).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {type === 'LIKERT' && (
            <FormField label="Ölçek (5 puan)">
              <div className="flex flex-wrap gap-1.5">
                {LIKERT_LABELS.map((l, i) => (
                  <Badge key={l} variant="secondary">
                    {i + 1} · {l}
                  </Badge>
                ))}
              </div>
            </FormField>
          )}

          {isChoice && (
            <FormField label="Seçenekler" error={errors.options}>
              <div className="flex flex-col gap-2">
                {options.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className={cn(
                        'size-[18px] shrink-0 border-2 border-border-strong',
                        type === 'MULTIPLE_CHOICE' ? 'rounded-[5px]' : 'rounded-full',
                      )}
                    />
                    <Input aria-label={`Seçenek ${i + 1}`} value={o} onChange={(e) => setOption(i, e.target.value)} />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Seçeneği sil"
                      className="hover:bg-destructive-soft hover:text-destructive"
                      onClick={() => setOptions((prev) => prev.filter((_, k) => k !== i))}
                    >
                      <X />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-start text-primary"
                  onClick={() => setOptions((prev) => [...prev, `Seçenek ${prev.length + 1}`])}
                >
                  <Plus />
                  Seçenek ekle
                </Button>
              </div>
            </FormField>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="q-mandatory" className="text-sm">
              Zorunlu soru
            </Label>
            <Switch id="q-mandatory" checked={mandatory} onCheckedChange={setMandatory} />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Vazgeç
          </Button>
          <Button onClick={submit}>{question ? 'Kaydet' : 'Oluştur'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
