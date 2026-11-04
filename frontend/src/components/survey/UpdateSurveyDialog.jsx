import { useState } from 'react'
import { toast } from 'sonner'

import { FormField } from '@/components/common/FormField'
import { Alert, AlertDescription } from '@/components/shadcnui/alert'
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
import { isFutureDateTime, splitLocalDateTime, toLocalDateTime } from '@/lib/format'
import { surveyService } from '@/services/surveyService'

/**
 * Bitiş tarihi uzatma (FR-51). Backend kuralı: süresi dolmuş ankette yalnızca endDate gönderilirse anket tekrar LIVE olur.
 * Yayındaki anketin yapısı kilitlidir (BR-04); bu yüzden "Düzenle" yalnızca tarihi günceller.
 */
export function UpdateSurveyDialog({ survey, open, onOpenChange, onUpdated }) {
  const initial = splitLocalDateTime(survey?.endDate)
  const [date, setDate] = useState(initial.date)
  const [time, setTime] = useState(initial.time || '18:00')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function save() {
    setError(null)
    if (!isFutureDateTime(date, time)) {
      setError('Bitiş tarihi ileri bir tarih olmalıdır.')
      return
    }
    setSaving(true)
    try {
      await surveyService.update(survey.id, { endDate: toLocalDateTime(date, time) })
      toast.success('Bitiş tarihi güncellendi')
      onOpenChange(false)
      onUpdated?.()
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
          <DialogTitle>Bitiş tarihini güncelle</DialogTitle>
          <DialogDescription>{survey?.title}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {survey?.status === 'OUTDATED' && (
            <Alert variant="warning">
              <AlertDescription>Anketin süresi dolmuş. Yeni bir tarih seçtiğinizde anket tekrar yayına alınır.</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Tarih" htmlFor="upd-date">
              <Input id="upd-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </FormField>
            <FormField label="Saat" htmlFor="upd-time">
              <Input id="upd-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </FormField>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">Saat dilimi: Europe/Istanbul</p>
          {error && <p className="text-[13px] text-destructive">{error}</p>}
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
