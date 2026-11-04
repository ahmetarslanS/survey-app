import { Download, Mail, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/shadcnui/alert'
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
import { downloadParticipantTemplate, isValidEmail, parseParticipantCsv } from '@/lib/csv'

/**
 * S-05: Katılımcı yönetimi (FR-40, FR-41).
 * Liste üst bileşende tutulur; bu diyalog `participants` dizisini `onChange` ile günceller.
 */
export function ParticipantsDialog({ open, onOpenChange, participants, onChange }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [importSummary, setImportSummary] = useState(null)
  const fileRef = useRef(null)

  function addEmail() {
    const value = email.trim().toLowerCase()
    if (!isValidEmail(value)) return setError('Geçerli bir e-posta adresi girin.')
    if (participants.includes(value)) return setError('Bu adres zaten listede.')
    onChange([value, ...participants])
    setEmail('')
    setError(null)
  }

  async function handleFile(file) {
    if (!file) return
    const text = await file.text()
    const result = parseParticipantCsv(text, participants)
    onChange([...result.valid, ...participants])
    setImportSummary({ ...result, fileName: file.name })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Katılımcılar</DialogTitle>
          <DialogDescription>Her katılımcıya kişiye özel, tek kullanımlık link gönderilir.</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="participant-email" className="text-[13px] font-medium">
              E-posta
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
                <Input
                  id="participant-email"
                  type="email"
                  className="pl-9"
                  placeholder="user@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addEmail()
                    }
                  }}
                />
              </div>
              <Button onClick={addEmail}>Ekle</Button>
            </div>
            {error && <p className="text-[13px] text-destructive">{error}</p>}
          </div>

          <div className="flex items-center gap-3 rounded-[10px] border border-dashed border-border-strong p-3.5 text-[13px] text-muted-foreground">
            <Upload className="size-4 shrink-0" />
            <div className="flex-1">
              <button type="button" className="font-semibold text-primary" onClick={() => fileRef.current?.click()}>
                CSV dosyası yükleyin
              </button>
              <div className="mt-0.5 text-xs">Tek sütun: email</div>
            </div>
            <Button variant="ghost" size="sm" className="text-primary" onClick={downloadParticipantTemplate}>
              <Download />
              Örnek dosya
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>

          {importSummary && (
            <Alert variant={importSummary.errors.length ? 'warning' : 'success'}>
              <AlertTitle>
                {importSummary.valid.length} / {importSummary.total} satır eklendi
              </AlertTitle>
              <AlertDescription>
                {importSummary.errors.length === 0 && <p>Tüm satırlar başarıyla içe aktarıldı.</p>}
                {importSummary.errors.slice(0, 5).map((e) => (
                  <p key={e.line}>
                    Satır {e.line}: {e.value || '(boş)'} — {e.reason}
                  </p>
                ))}
                {importSummary.errors.length > 5 && <p>… ve {importSummary.errors.length - 5} satır daha</p>}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <b className="font-semibold">{participants.length} katılımcı</b>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive-soft hover:text-destructive"
              disabled={participants.length === 0}
              onClick={() => {
                onChange([])
                setImportSummary(null)
              }}
            >
              Tümünü temizle
            </Button>
          </div>

          <div className="max-h-[230px] overflow-auto rounded-[10px] border">
            {participants.length === 0 && (
              <div className="p-[18px] text-center text-muted-foreground">Henüz katılımcı eklenmedi</div>
            )}
            {participants.map((m) => (
              <div key={m} className="flex items-center gap-2.5 border-b py-2 pr-2.5 pl-3 last:border-b-0">
                <span className="grid size-[26px] shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-semibold text-[#475467]">
                  {m.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate">{m}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive-soft hover:text-destructive"
                  onClick={() => onChange(participants.filter((p) => p !== m))}
                >
                  Sil
                </Button>
              </div>
            ))}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Tamam</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
