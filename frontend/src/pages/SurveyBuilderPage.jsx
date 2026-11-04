import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CalendarDays, Clock, Eye, LayoutTemplate, PlusCircle, Save, Send, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useBlocker, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { FormField } from '@/components/common/FormField'
import { PageHeader } from '@/components/common/PageHeader'
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcnui/alert'
import { Badge } from '@/components/shadcnui/badge'
import { Button } from '@/components/shadcnui/button'
import { Card } from '@/components/shadcnui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcnui/dialog'
import { Input } from '@/components/shadcnui/input'
import { Separator } from '@/components/shadcnui/separator'
import { Skeleton } from '@/components/shadcnui/skeleton'
import { Switch } from '@/components/shadcnui/switch'
import { Textarea } from '@/components/shadcnui/textarea'
import { ParticipantsDialog } from '@/components/survey/ParticipantsDialog'
import { QuestionDialog } from '@/components/survey/QuestionDialog'
import { SentDialog } from '@/components/survey/SentDialog'
import { SortableSection } from '@/components/survey/SortableSection'
import { toLocalDateTime } from '@/lib/format'
import {
  allQuestions,
  clearDraft,
  createEmptyDraft,
  loadDraft,
  newId,
  saveDraft,
  savePreview,
  templateToDraft,
  toCreateRequest,
  validateDraft,
} from '@/lib/surveyDraft'
import { surveyService } from '@/services/surveyService'
import { templateService } from '@/services/templateService'

const today = () => new Date().toISOString().slice(0, 10)

export default function SurveyBuilderPage() {
  const navigate = useNavigate()
  const [draft, setDraft] = useState(() => loadDraft() ?? createEmptyDraft())
  const [dirty, setDirty] = useState(false)
  const dirtyRef = useRef(false)

  const [questionDialog, setQuestionDialog] = useState(null) // { sectionId, question | null }
  const [participantsOpen, setParticipantsOpen] = useState(false)
  const [confirm, setConfirm] = useState(null) // { type: 'question' | 'section', ... }
  const [errors, setErrors] = useState([])
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(null) // { count, endDate }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // FR-27: kaydedilmemiş değişiklik varken sayfadan çıkışta uyarı
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirtyRef.current && currentLocation.pathname !== nextLocation.pathname,
  )
  const markDirty = (value) => {
    dirtyRef.current = value
    setDirty(value)
  }

  // FR-12: /surveys/new?template={id} -> şablonu taslağa yükle; kullanıcı soruları düzenleyip gönderir
  const [searchParams, setSearchParams] = useSearchParams()
  const templateId = searchParams.get('template')
  const [template, setTemplate] = useState({ status: templateId ? 'loading' : 'idle', name: null, error: null })

  useEffect(() => {
    if (!templateId) return undefined
    const run = { cancelled: false }
    templateService
      .get(templateId)
      .then((t) => {
        if (run.cancelled) return
        setDraft(templateToDraft(t))
        markDirty(true)
        setTemplate({ status: 'loaded', name: t.name, error: null })
        toast.success(`"${t.name}" şablonu yüklendi`)
        // Parametre kaldırılır ki yenilemede/"Taslağı Kaydet" sonrası şablon tekrar yüklenip taslağın üzerine yazmasın
        setSearchParams({}, { replace: true })
      })
      .catch((e) => {
        if (!run.cancelled) setTemplate({ status: 'error', name: null, error: e })
      })
    return () => {
      run.cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId])

  // Tarayıcı sekmesi kapatma / yenileme uyarısı
  useEffect(() => {
    const handler = (e) => {
      if (dirtyRef.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  function update(fn) {
    setDraft((prev) => fn(structuredClone(prev)))
    markDirty(true)
    setErrors([])
  }

  const setField = (field, value) => update((d) => ({ ...d, [field]: value }))
  const section = (d, id) => d.sections.find((s) => s.id === id)

  // ---- Bölümler ----
  const addSection = () =>
    update((d) => {
      d.sections.push({ id: newId(), title: `Bölüm ${d.sections.length + 1}`, questions: [] })
      return d
    })
  const deleteSection = (id) =>
    update((d) => {
      d.sections = d.sections.filter((s) => s.id !== id)
      return d
    })
  const handleSectionDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    update((d) => {
      const from = d.sections.findIndex((s) => s.id === active.id)
      const to = d.sections.findIndex((s) => s.id === over.id)
      d.sections = arrayMove(d.sections, from, to)
      return d
    })
  }

  // ---- Sorular ----
  const saveQuestion = (sectionId, existing, values) =>
    update((d) => {
      const s = section(d, sectionId)
      if (existing) s.questions = s.questions.map((q) => (q.id === existing.id ? { ...q, ...values } : q))
      else s.questions.push({ id: newId(), ...values })
      return d
    })
  const copyQuestion = (sectionId, q) =>
    update((d) => {
      const s = section(d, sectionId)
      const at = s.questions.findIndex((x) => x.id === q.id)
      s.questions.splice(at + 1, 0, { ...q, id: newId() })
      return d
    })
  const deleteQuestion = (sectionId, q) =>
    update((d) => {
      const s = section(d, sectionId)
      s.questions = s.questions.filter((x) => x.id !== q.id)
      return d
    })

  // ---- Kaydet / Önizle / Gönder ----
  function handleSaveDraft() {
    saveDraft(draft)
    markDirty(false)
    toast.success('Taslak kaydedildi')
  }

  function handlePreview() {
    if (allQuestions(draft).length === 0) {
      toast.error('Önizleme için en az bir soru ekleyin.')
      return
    }
    // Önizlemeden dönünce değişiklikler kaybolmasın diye taslak da kaydedilir
    saveDraft(draft)
    savePreview(draft)
    markDirty(false)
    navigate('/survey-preview')
  }

  async function handleSend() {
    const found = validateDraft(draft)
    setErrors(found)
    if (found.length) return
    setSending(true)
    try {
      await surveyService.create(toCreateRequest(draft))
      clearDraft()
      markDirty(false)
      setSent({ count: draft.participants.length, endDate: toLocalDateTime(draft.endDate, draft.endTime) })
    } catch (e) {
      setErrors([e.message])
    } finally {
      setSending(false)
    }
  }

  const questionCount = allQuestions(draft).length
  const mandatoryCount = allQuestions(draft).filter((q) => q.mandatory).length
  // Soru numaraları anket genelinde ardışıktır; sıra değişince otomatik güncellenir (FR-24)
  const startNumbers = draft.sections.map(
    (_, i) => 1 + draft.sections.slice(0, i).reduce((sum, s) => sum + s.questions.length, 0),
  )

  const dialogSection = questionDialog ? section(draft, questionDialog.sectionId) : null

  if (template.status === 'loading') {
    return (
      <>
        <PageHeader breadcrumb={[{ label: 'Şablonlar', to: '/templates' }, { label: 'Anket Oluşturma' }]} title="Anket Oluşturma" />
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Anketlerim', to: '/surveys' }, { label: 'Anket Oluşturma' }]}
        title="Anket Oluşturma"
        meta={
          <>
            <Badge variant="secondary">Taslak</Badge>
            {template.name && (
              <Badge>
                <LayoutTemplate />
                Şablon: {template.name}
              </Badge>
            )}
            {dirty ? 'Kaydedilmemiş değişiklikler var' : 'Tüm değişiklikler kaydedildi'}
          </>
        }
        actions={
          <>
            <Button variant="outline" onClick={handlePreview}>
              <Eye />
              Önizle
            </Button>
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save />
              Taslağı Kaydet
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              <Send />
              {sending ? 'Gönderiliyor…' : 'Gönder'}
            </Button>
          </>
        }
      />

      {template.status === 'error' && (
        <Alert variant="destructive" className="mb-5">
          <AlertTitle>Şablon yüklenemedi</AlertTitle>
          <AlertDescription>{template.error?.message} Boş bir anketle devam edebilirsiniz.</AlertDescription>
        </Alert>
      )}

      {errors.length > 0 && (
        <Alert variant="destructive" className="mb-5">
          <AlertTitle>Anket gönderilemedi</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <Card className="mb-4 flex flex-col gap-3.5 p-[18px]">
            <FormField label="Anket başlığı" htmlFor="survey-title">
              <Input id="survey-title" value={draft.title} onChange={(e) => setField('title', e.target.value)} />
            </FormField>
            <FormField label="Açıklama" htmlFor="survey-description">
              <Textarea
                id="survey-description"
                className="min-h-16"
                value={draft.description}
                onChange={(e) => setField('description', e.target.value)}
              />
            </FormField>
          </Card>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
            <SortableContext items={draft.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {draft.sections.map((s, i) => {
                return (
                  <SortableSection
                    key={s.id}
                    section={s}
                    index={i}
                    startNumber={startNumbers[i]}
                    canDelete={draft.sections.length > 1}
                    onRename={(title) =>
                      update((d) => {
                        section(d, s.id).title = title
                        return d
                      })
                    }
                    onDelete={() =>
                      s.questions.length ? setConfirm({ type: 'section', section: s }) : deleteSection(s.id)
                    }
                    onAddQuestion={() => setQuestionDialog({ sectionId: s.id, question: null })}
                    onEditQuestion={(q) => setQuestionDialog({ sectionId: s.id, question: q })}
                    onCopyQuestion={(q) => copyQuestion(s.id, q)}
                    onDeleteQuestion={(q) => setConfirm({ type: 'question', sectionId: s.id, question: q })}
                    onReorderQuestions={(questions) =>
                      update((d) => {
                        section(d, s.id).questions = questions
                        return d
                      })
                    }
                  />
                )
              })}
            </SortableContext>
          </DndContext>

          <Button variant="outline" className="w-full justify-center border-dashed shadow-none" onClick={addSection}>
            <PlusCircle />
            Yeni Bölüm Ekle
          </Button>
        </div>

        <Card className="sticky top-5 flex flex-col gap-4 p-[18px]">
          <h2 className="text-base font-semibold">Anket Ayarları</h2>

          <FormField label="Bitiş tarihi ve saati" hint="Saat dilimi: Europe/Istanbul">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-subtle" />
                <Input
                  type="date"
                  aria-label="Bitiş tarihi"
                  min={today()}
                  className="pl-8"
                  value={draft.endDate}
                  onChange={(e) => setField('endDate', e.target.value)}
                />
              </div>
              <div className="relative">
                <Clock className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-subtle" />
                <Input
                  type="time"
                  aria-label="Bitiş saati"
                  className="pl-8"
                  value={draft.endTime}
                  onChange={(e) => setField('endTime', e.target.value)}
                />
              </div>
            </div>
          </FormField>

          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">Anonim yanıt</div>
              <div className="mt-0.5 text-xs text-muted-foreground">Yanıtlar kişiyle ilişkilendirilmez</div>
            </div>
            <Switch aria-label="Anonim yanıt" checked={draft.anonymous} onCheckedChange={(v) => setField('anonymous', v)} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Katılımcılar</span>
            <b>{draft.participants.length} kişi</b>
          </div>
          <Button variant="outline" className="justify-center" onClick={() => setParticipantsOpen(true)}>
            <Users />
            Katılımcıları Yönet
          </Button>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Bölüm</span>
            <b>{draft.sections.length}</b>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Soru</span>
            <b>{questionCount}</b>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Zorunlu soru</span>
            <b>{mandatoryCount}</b>
          </div>
        </Card>
      </div>

      {questionDialog && (
        <QuestionDialog
          key={questionDialog.question?.id ?? `new-${questionDialog.sectionId}`}
          open
          onOpenChange={(o) => !o && setQuestionDialog(null)}
          sectionTitle={dialogSection?.title}
          question={questionDialog.question}
          onSave={(values) => saveQuestion(questionDialog.sectionId, questionDialog.question, values)}
        />
      )}

      <ParticipantsDialog
        open={participantsOpen}
        onOpenChange={setParticipantsOpen}
        participants={draft.participants}
        onChange={(list) => setField('participants', list)}
      />

      {confirm && (
        <ConfirmDialog
          open
          destructive
          onOpenChange={(o) => !o && setConfirm(null)}
          title={confirm.type === 'question' ? 'Soru silinsin mi?' : 'Bölüm silinsin mi?'}
          description={
            confirm.type === 'question'
              ? 'Bu soru ankete geri dönmemek üzere kaldırılır.'
              : `"${confirm.section.title}" bölümü ve içindeki ${confirm.section.questions.length} soru silinir.`
          }
          confirmLabel="Sil"
          onConfirm={() =>
            confirm.type === 'question' ? deleteQuestion(confirm.sectionId, confirm.question) : deleteSection(confirm.section.id)
          }
        />
      )}

      <SentDialog
        open={Boolean(sent)}
        participantCount={sent?.count}
        endDate={sent?.endDate}
        onClose={() => navigate('/surveys')}
      />

      <Dialog open={blocker.state === 'blocked'} onOpenChange={(o) => !o && blocker.reset?.()}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Kaydedilmemiş değişiklikler</DialogTitle>
            <DialogDescription>Bu sayfadan ayrılırsanız yaptığınız değişiklikler kaybolacak.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => blocker.reset?.()}>
              Sayfada kal
            </Button>
            <Button variant="destructive" onClick={() => blocker.proceed?.()}>
              Kaydetmeden çık
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
