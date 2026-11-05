import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Eye, FileWarning, LayoutTemplate, PlusCircle, Save, Send, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ErrorState } from '@/components/common/ErrorState'
import { FormField } from '@/components/common/FormField'
import { PageHeader } from '@/components/common/PageHeader'
import { StateCard } from '@/components/common/StateCard'
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
import { formatDateTime, isFutureDateTime } from '@/lib/format'
import {
  allQuestions,
  createEmptyDraft,
  detailToDraft,
  newId,
  savePreview,
  templateToDraft,
  toCreateRequest,
  validateForSave,
  validateForSend,
} from '@/lib/surveyDraft'
import { surveyService } from '@/services/surveyService'
import { templateService } from '@/services/templateService'

const today = () => new Date().toISOString().slice(0, 10)
const PREVIEW_WINDOW = 'survey-preview'

/** Gönderim hatasında kırmızıyla işaretlenecek alanlar */
function sendErrorFields(draft) {
  return {
    title: !draft.title.trim(),
    endDate: !draft.endDate || !isFutureDateTime(draft.endDate, draft.endTime),
    participants: draft.participants.length === 0,
  }
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-secondary px-2 py-2 text-center">
      <div className="text-base font-semibold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  )
}

/**
 * S-03: Anket oluşturma / taslak düzenleme.
 *  - /surveys/new                  boş anket
 *  - /surveys/new?template={id}    şablondan (FR-12)
 *  - /surveys/{id}/edit            kayıtlı taslak (yalnızca DRAFT)
 *
 * "Taslağı Kaydet" anketi backend'e DRAFT olarak yazar (Anketlerim'de görünür, mail gitmez).
 * "Gönder" önce kaydeder, sonra taslağı yayına alıp davetleri gönderir; gönderim başarısız olsa da taslak kaybolmaz.
 */
export default function SurveyBuilderPage() {
  const navigate = useNavigate()
  const { surveyId: routeSurveyId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const templateId = routeSurveyId ? null : searchParams.get('template')

  const [surveyId, setSurveyId] = useState(routeSurveyId ?? null)
  const [draft, setDraft] = useState(createEmptyDraft)
  const [load, setLoad] = useState({
    status: routeSurveyId || templateId ? 'loading' : 'ready', // loading | ready | error | notDraft
    error: null,
  })
  const [templateName, setTemplateName] = useState(null)
  const [templateError, setTemplateError] = useState(null)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [dirty, setDirty] = useState(false)
  const dirtyRef = useRef(false)
  // Yeni taslak kaydedilince URL /surveys/{id}/edit olur; aynı bileşen kalırsa taslak tekrar yüklenmesin
  const createdIdRef = useRef(null)

  const [questionDialog, setQuestionDialog] = useState(null) // { sectionId, question | null }
  const [participantsOpen, setParticipantsOpen] = useState(false)
  const [confirm, setConfirm] = useState(null) // { type: 'question' | 'section', ... }
  const [errors, setErrors] = useState(null) // { title, items: [] }
  const [busy, setBusy] = useState(null) // 'save' | 'send' | null
  const [sent, setSent] = useState(null) // SendSurveyResponse

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

  // Kayıtlı taslağı yükle
  useEffect(() => {
    if (!routeSurveyId || routeSurveyId === createdIdRef.current) return undefined
    const run = { cancelled: false }
    surveyService
      .get(routeSurveyId)
      .then((detail) => {
        if (run.cancelled) return
        if (detail.status !== 'DRAFT') {
          setLoad({ status: 'notDraft', error: null })
          return
        }
        setDraft(detailToDraft(detail))
        setSurveyId(String(detail.id))
        setLastSavedAt(detail.updatedDateTime)
        markDirty(false)
        setLoad({ status: 'ready', error: null })
      })
      .catch((e) => {
        if (!run.cancelled) setLoad({ status: 'error', error: e })
      })
    return () => {
      run.cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeSurveyId])

  // FR-12: /surveys/new?template={id} -> şablonu yeni taslağa yükle
  useEffect(() => {
    if (!templateId) return undefined
    const run = { cancelled: false }
    templateService
      .get(templateId)
      .then((t) => {
        if (run.cancelled) return
        setDraft(templateToDraft(t))
        markDirty(true)
        setTemplateName(t.name)
        toast.success(`"${t.name}" şablonu yüklendi`)
        // Parametre kaldırılır ki sayfa yenilenince şablon tekrar yüklenip değişikliklerin üzerine yazmasın
        setSearchParams({}, { replace: true })
      })
      .catch((e) => {
        if (!run.cancelled) setTemplateError(e)
      })
      .finally(() => {
        if (!run.cancelled) setLoad({ status: 'ready', error: null })
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
    setErrors(null)
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

  /** Taslağı backend'e yazar (ilk kayıtta oluşturur). Dönen değer: surveyId */
  async function persistDraft() {
    const payload = toCreateRequest(draft)
    let id = surveyId
    if (id) {
      await surveyService.updateDraft(id, payload)
    } else {
      id = String(await surveyService.createDraft(payload))
      setSurveyId(id)
      createdIdRef.current = id
    }
    markDirty(false)
    setLastSavedAt(new Date().toISOString())
    return id
  }

  async function handleSaveDraft() {
    const found = validateForSave(draft)
    if (found.length) {
      setErrors({ title: 'Taslak kaydedilemedi', items: found, fields: { title: true } })
      return
    }
    setBusy('save')
    try {
      const wasNew = !surveyId
      const id = await persistDraft()
      toast.success('Taslak kaydedildi', { description: 'Anketlerim listesinde "Taslak" olarak görünür.' })
      if (wasNew) navigate(`/surveys/${id}/edit`, { replace: true })
    } catch (e) {
      setErrors({ title: 'Taslak kaydedilemedi', items: [e.message] })
    } finally {
      setBusy(null)
    }
  }

  async function handleSend() {
    const found = validateForSend(draft)
    if (found.length) {
      setErrors({ title: 'Anket gönderilemedi', items: found, fields: sendErrorFields(draft) })
      return
    }
    setBusy('send')
    let savedId = null
    try {
      savedId = await persistDraft()
      setSent(await surveyService.send(savedId))
    } catch (e) {
      // Kayıt başarılı, gönderim başarısızsa taslak saklanır; surveyId set edildiği için sonraki kayıt aynı taslağı günceller.
      // (URL bilerek değiştirilmez: rota değişince builder yeniden kurulur ve bu hata mesajı kaybolurdu.)
      setErrors({
        title: 'Anket gönderilemedi',
        items: [e.message, ...(savedId ? ['Anket taslak olarak kaydedildi; düzeltip tekrar gönderebilirsiniz.'] : [])],
      })
    } finally {
      setBusy(null)
    }
  }

  function handlePreview() {
    // Katılımcının göreceği form yeni sekmede açılır; buradaki kaydedilmemiş değişiklikler kaybolmaz.
    // Sabit pencere adı: tekrar basınca yeni sekme yığılmaz, açık önizleme sekmesi güncel taslakla yenilenir.
    savePreview(draft)
    window.open('/survey-preview', PREVIEW_WINDOW)
  }

  // ---- Ekran ----

  const pageTitle = surveyId ? 'Taslağı Düzenle' : 'Anket Oluşturma'
  const breadcrumb = [
    templateName ? { label: 'Şablonlar', to: '/templates' } : { label: 'Anketlerim', to: '/surveys' },
    { label: pageTitle },
  ]

  if (load.status === 'loading') {
    return (
      <>
        <PageHeader breadcrumb={breadcrumb} title={pageTitle} />
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </>
    )
  }
  if (load.status === 'error') {
    return (
      <>
        <PageHeader breadcrumb={breadcrumb} title={pageTitle} />
        <ErrorState error={load.error} title="Anket yüklenemedi" />
      </>
    )
  }
  if (load.status === 'notDraft') {
    return (
      <>
        <PageHeader breadcrumb={breadcrumb} title={pageTitle} />
        <StateCard
          icon={FileWarning}
          tone="warning"
          title="Bu anket yayınlanmış"
          actions={
            <Button asChild>
              <Link to="/surveys">Anketlerime dön</Link>
            </Button>
          }
        >
          Yalnızca taslak anketler düzenlenebilir. Yayındaki ankette soru yapısı kilitlidir; bitiş tarihini Anketlerim
          listesinden güncelleyebilirsiniz.
        </StateCard>
      </>
    )
  }

  const questionCount = allQuestions(draft).length
  const mandatoryCount = allQuestions(draft).filter((q) => q.mandatory).length
  // Soru numaraları anket genelinde ardışıktır; sıra değişince otomatik güncellenir (FR-24)
  const startNumbers = draft.sections.map(
    (_, i) => 1 + draft.sections.slice(0, i).reduce((sum, s) => sum + s.questions.length, 0),
  )
  const dialogSection = questionDialog ? section(draft, questionDialog.sectionId) : null

  const invalid = errors?.fields ?? {}

  return (
    <>
      {/* Sağ panel sayfanın en üstünden başlar ve soldaki menü gibi ekrana sabitlenir (sticky); sayfa kaydırıldığında
          yalnızca soldaki anket içeriği kayar. Hata mesajları da panelde, butonların hemen üstünde gösterilir. */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <PageHeader
            breadcrumb={breadcrumb}
            title={pageTitle}
            meta={
              <>
                <Badge variant="secondary">Taslak</Badge>
                {templateName && (
                  <Badge>
                    <LayoutTemplate />
                    Şablon: {templateName}
                  </Badge>
                )}
                {dirty
                  ? 'Kaydedilmemiş değişiklikler var'
                  : lastSavedAt
                    ? `Son kayıt: ${formatDateTime(lastSavedAt)}`
                    : 'Henüz kaydedilmedi'}
              </>
            }
            actions={
              <Button variant="outline" onClick={handlePreview}>
                <Eye />
                Önizle
              </Button>
            }
          />

          {templateError && (
            <Alert variant="destructive" className="mb-5">
              <AlertTitle>Şablon yüklenemedi</AlertTitle>
              <AlertDescription>{templateError.message} Boş bir anketle devam edebilirsiniz.</AlertDescription>
            </Alert>
          )}

          <Card className="mb-4 flex flex-col gap-3.5 p-[18px]">
            <FormField label="Anket başlığı" htmlFor="survey-title">
              <Input
                id="survey-title"
                aria-invalid={invalid.title || undefined}
                value={draft.title}
                onChange={(e) => setField('title', e.target.value)}
              />
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
              {draft.sections.map((s, i) => (
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
                  onDelete={() => (s.questions.length ? setConfirm({ type: 'section', section: s }) : deleteSection(s.id))}
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
              ))}
            </SortableContext>
          </DndContext>

          <Button variant="outline" className="w-full justify-center border-dashed shadow-none" onClick={addSection}>
            <PlusCircle />
            Yeni Bölüm Ekle
          </Button>
        </div>

        <Card className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]">
          {/* Ayarlar kompakt tutulur, panel normal ekran yüksekliklerinde kaymaz. Çok kısa pencerelerde yalnızca bu
              bölüm kayar; hata mesajı ve butonlar (alt bölüm) her zaman görünür kalır. */}
          <div className="flex flex-col gap-4 p-[18px] lg:min-h-0 lg:overflow-y-auto">
            <h2 className="text-base font-semibold">Anket Ayarları</h2>

            <FormField label="Bitiş tarihi ve saati" hint="Saat dilimi: Europe/Istanbul">
              {/* Tarih alanı, takvim ikonu dahil içeriğine yetecek genişlikte; saat alanı sabit genişlikte */}
              <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2">
                <Input
                  type="date"
                  aria-label="Bitiş tarihi"
                  aria-invalid={invalid.endDate || undefined}
                  min={today()}
                  value={draft.endDate}
                  onChange={(e) => setField('endDate', e.target.value)}
                />
                <Input
                  type="time"
                  aria-label="Bitiş saati"
                  aria-invalid={invalid.endDate || undefined}
                  value={draft.endTime}
                  onChange={(e) => setField('endTime', e.target.value)}
                />
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

            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">Katılımcılar</div>
                <div className={invalid.participants ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
                  {draft.participants.length} kişi
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                aria-invalid={invalid.participants || undefined}
                className="aria-invalid:border-destructive"
                onClick={() => setParticipantsOpen(true)}
              >
                <Users />
                Yönet
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Stat label="Bölüm" value={draft.sections.length} />
              <Stat label="Soru" value={questionCount} />
              <Stat label="Zorunlu" value={mandatoryCount} />
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2.5 border-t p-[18px]">
            {errors && (
              <Alert variant="destructive" role="alert" className="px-3 py-2.5">
                <AlertTitle>{errors.title}</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 text-xs">
                    {errors.items.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <Button variant="outline" className="w-full" onClick={handleSaveDraft} disabled={Boolean(busy)}>
              <Save />
              {busy === 'save' ? 'Kaydediliyor…' : 'Taslağı Kaydet'}
            </Button>
            <Button className="w-full" onClick={handleSend} disabled={Boolean(busy)}>
              <Send />
              {busy === 'send' ? 'Gönderiliyor…' : 'Gönder'}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Gönder, anketi kaydedip katılımcılara davet maili gönderir.
            </p>
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

      <SentDialog open={Boolean(sent)} result={sent} onClose={() => navigate('/surveys')} />

      <Dialog open={blocker.state === 'blocked'} onOpenChange={(o) => !o && blocker.reset?.()}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Kaydedilmemiş değişiklikler</DialogTitle>
            <DialogDescription>
              Bu sayfadan ayrılırsanız kaydetmediğiniz değişiklikler kaybolacak. Saklamak için önce "Taslağı Kaydet"e basın.
            </DialogDescription>
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
