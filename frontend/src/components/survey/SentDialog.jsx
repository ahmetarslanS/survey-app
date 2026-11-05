import { AlertTriangle, Check } from 'lucide-react'

import { Button } from '@/components/shadcnui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcnui/dialog'
import { formatDateTime } from '@/lib/format'

/** S-06: Gönderim onayı ve özeti (FR-42). result: SendSurveyResponse */
export function SentDialog({ open, result, onClose }) {
  const failed = result?.failedCount ?? 0
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[420px]" showClose={false}>
        <DialogHeader className="items-center pt-8 pr-6 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-success-soft text-success ring-8 ring-[#F6FEF9]">
            <Check className="size-7" />
          </div>
          <DialogTitle className="mt-4 text-lg">Anket katılımcılara başarıyla gönderildi</DialogTitle>
          <DialogDescription className="leading-relaxed">
            {result?.sentCount ?? 0} kişiye kişiye özel link iletildi. Anket{' '}
            <b className="text-foreground">{formatDateTime(result?.endDate)}</b> tarihine kadar yanıta açık.
          </DialogDescription>
          {failed > 0 && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-left text-[13px] text-warning">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {failed} katılımcıya davet maili gönderilemedi. Adresleri kontrol edin.
            </p>
          )}
        </DialogHeader>
        <DialogFooter className="justify-center">
          <Button onClick={onClose}>Anketlerime dön</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
