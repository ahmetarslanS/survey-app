import { Check } from 'lucide-react'

import { Button } from '@/components/shadcnui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcnui/dialog'
import { formatDateTime } from '@/lib/format'

/** S-06: Gönderim onayı */
export function SentDialog({ open, onClose, participantCount, endDate }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[420px]" showClose={false}>
        <DialogHeader className="items-center pt-8 pr-6 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-success-soft text-success ring-8 ring-[#F6FEF9]">
            <Check className="size-7" />
          </div>
          <DialogTitle className="mt-4 text-lg">Anket katılımcılara başarıyla gönderildi</DialogTitle>
          <DialogDescription className="leading-relaxed">
            {participantCount} kişiye kişiye özel link iletildi. Anket <b className="text-foreground">{formatDateTime(endDate)}</b>{' '}
            tarihine kadar yanıta açık.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="justify-center">
          <Button onClick={onClose}>Anketlerime dön</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
