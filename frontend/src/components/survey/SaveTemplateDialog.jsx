import { useState } from 'react'
import { toast } from 'sonner'

import { FormField } from '@/components/common/FormField'
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
import { Textarea } from '@/components/shadcnui/textarea'
import { templateService } from '@/services/templateService'

/** Mevcut anketi şablon olarak kaydeder (FR-30): başlık, açıklama ve sorular kopyalanır; katılımcı/yanıt kopyalanmaz. */
export function SaveTemplateDialog({ survey, open, onOpenChange }) {
  const [name, setName] = useState(survey?.title ?? '')
  const [description, setDescription] = useState(survey?.description ?? '')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim()) {
      setError('Şablon adı zorunludur.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await templateService.createFromSurvey(survey.id, { name: name.trim(), description: description.trim() })
      toast.success('Şablon olarak kaydedildi')
      onOpenChange(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Şablon olarak kaydet</DialogTitle>
          <DialogDescription>Sorular ve bölümler şablona kopyalanır; katılımcılar ve yanıtlar kopyalanmaz.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <FormField label="Şablon adı" htmlFor="tpl-name" error={error}>
            <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(error)} />
          </FormField>
          <FormField label="Açıklama" htmlFor="tpl-desc">
            <Textarea id="tpl-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormField>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Vazgeç
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
