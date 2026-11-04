import { ArrowLeft, ArrowRight, Cloud, CloudOff, Eye, Send } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/shadcnui/alert'
import { Button } from '@/components/shadcnui/button'
import { Card } from '@/components/shadcnui/card'
import { Progress } from '@/components/shadcnui/progress'
import { Skeleton } from '@/components/shadcnui/skeleton'
import { QuestionInput } from '@/components/survey/QuestionInput'
import { ErrorState } from '@/components/common/ErrorState'
import { isEmptyAnswer } from '@/lib/answers'
import { loadPreview } from '@/lib/surveyDraft'
import { buildSubmitPayload, participantService } from '@/services/participantService'

/**
 * S-08: Katılımcı formu.
 *  - /survey/:surveyId?token=...   gerçek katılımcı akışı
 *  - /survey-preview               yönetici önizlemesi (yanıtlar kaydedilmez, FR-26)
 */
export default function SurveyFormPage({ preview = false }) {
  const { surveyId } = useParams()
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()

  const [survey, setSurvey] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [answers, setAnswers] = useState({})
  const [step, setStep] = useState(0)
  const [showError, setShowError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [saveState, setSaveState] = useState(null) // null | 'saved' | 'error'
  const submittedRef = useRef(false)

  const questions = useMemo(
    () => (survey ? survey.sections.flatMap((s) => s.questions.map((q) => ({ ...q, sectionTitle: s.title }))) : []),
    [survey],
  )

  // Anketi yükle ve kaldığı yerden devam et (FR-63 / AS-02)
  useEffect(() => {
    const run = { cancelled: false }
    async function load() {
      try {
        let loaded
        if (preview) {
          loaded = loadPreview()
          if (!loaded) throw Object.assign(new Error('Önizlenecek anket bulunamadı. Anket oluşturma ekranından tekrar deneyin.'), {})
        } else {
          if (!token) {
            navigate('/access-error?reason=invalid', { replace: true })
            return
          }
          loaded = await participantService.getSurvey(surveyId, token)
        }
        if (run.cancelled) return

        const flat = loaded.sections.flatMap((s) => s.questions)
        // Ara kayıt sunucuda tutulur; aynı link başka cihazdan açılsa da kaldığı yerden devam eder
        const saved = preview ? {} : (loaded.draftAnswers ?? {})
        const firstUnanswered = flat.findIndex((q) => isEmptyAnswer(saved[q.id]))
        setAnswers(saved)
        setStep(firstUnanswered === -1 ? Math.max(0, flat.length - 1) : firstUnanswered)
        setSurvey(loaded)
      } catch (e) {
        if (run.cancelled) return
        if (e.reason) navigate(`/access-error?reason=${e.reason}`, { replace: true })
        else setLoadError(e)
      }
    }
    load()
    return () => {
      run.cancelled = true
    }
  }, [preview, surveyId, token, navigate])

  if (loadError) return <ErrorState error={loadError} title="Anket açılamadı" />
  if (!survey) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }
  if (questions.length === 0) return <ErrorState error={new Error('Bu ankette soru bulunmuyor.')} title="Anket boş" />

  const q = questions[step]
  const last = step === questions.length - 1
  const percent = Math.round(((step + 1) / questions.length) * 100)

  function persist(next) {
    if (preview) return
    participantService
      .saveDraft(surveyId, token, next)
      .then(() => setSaveState('saved'))
      .catch((e) => {
        // Gönderim başladıysa geç kalan taslak isteğinin "zaten yanıtlandı" hatası yok sayılır
        if (submittedRef.current) return
        if (e.reason) navigate(`/access-error?reason=${e.reason}`, { replace: true })
        else setSaveState('error')
      })
  }

  function setAnswer(value) {
    setAnswers((prev) => ({ ...prev, [q.id]: value }))
    setShowError(false)
  }

  function goBack() {
    persist(answers)
    setShowError(false)
    setStep((s) => Math.max(0, s - 1))
  }

  async function goNext() {
    if (q.mandatory && isEmptyAnswer(answers[q.id])) {
      setShowError(true)
      return
    }
    if (!last) {
      persist(answers) // her sayfa geçişinde otomatik kayıt
      setStep((s) => s + 1)
      return
    }

    // Son sayfada tüm zorunlu sorular tekrar kontrol edilir
    const missing = questions.findIndex((x) => x.mandatory && isEmptyAnswer(answers[x.id]))
    if (missing !== -1) {
      setStep(missing)
      setShowError(true)
      return
    }

    if (preview) {
      toast.info('Önizlemede yanıtlar kaydedilmez.')
      navigate('/surveys/new')
      return
    }

    setSubmitting(true)
    submittedRef.current = true
    try {
      await participantService.submit(surveyId, token, buildSubmitPayload(survey, answers, isEmptyAnswer))
      navigate('/thanks', { replace: true })
    } catch (e) {
      submittedRef.current = false
      if (e.reason) navigate(`/access-error?reason=${e.reason}`, { replace: true })
      else toast.error(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {preview && (
        <Alert variant="warning" className="mb-5">
          <Eye />
          <AlertDescription>
            Önizleme modundasınız; yanıtlar kaydedilmez.{' '}
            <Link to="/surveys/new" className="font-semibold underline">
              Düzenlemeye dön
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <h1 className="text-[22px] font-bold tracking-tight">{survey.title}</h1>
      <p className="mt-1.5 mb-5 leading-relaxed text-muted-foreground">
        {survey.description}
        {survey.isAnonymous && <b className="text-foreground"> Yanıtlarınız anonimdir.</b>}
      </p>

      <div className="mb-[18px] flex items-center gap-3 text-[13px] text-muted-foreground">
        <span>
          {step + 1} / {questions.length}
        </span>
        <Progress value={percent} className="h-2 flex-1" aria-label="İlerleme" />
        <span>%{percent}</span>
      </div>

      <Card className="p-6 sm:p-[26px]">
        {q.sectionTitle && (
          <div className="mb-2.5 text-xs font-semibold tracking-wider text-primary uppercase">{q.sectionTitle}</div>
        )}
        <div className="flex gap-3 text-base leading-snug font-semibold">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent text-[13px] text-primary">{step + 1}</span>
          <span>
            {q.text}
            {q.mandatory && (
              <span className="ml-0.5 text-destructive" aria-label="zorunlu">
                *
              </span>
            )}
          </span>
        </div>

        <QuestionInput key={q.id} question={q} value={answers[q.id]} onChange={setAnswer} />

        {showError && <p className="mt-3 text-[13px] text-destructive">Bu soru zorunludur, lütfen bir yanıt verin.</p>}

        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" onClick={goBack} disabled={step === 0}>
            <ArrowLeft />
            Geri
          </Button>
          {!preview && saveState === 'saved' && (
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <Cloud className="size-4" />
              Otomatik kaydedildi
            </span>
          )}
          {!preview && saveState === 'error' && (
            <span className="hidden items-center gap-1.5 text-xs text-destructive sm:flex">
              <CloudOff className="size-4" />
              Kaydedilemedi
            </span>
          )}
          <Button onClick={goNext} disabled={submitting}>
            {last ? (
              <>
                {submitting ? 'Gönderiliyor…' : 'Gönder'}
                <Send />
              </>
            ) : (
              <>
                İleri
                <ArrowRight />
              </>
            )}
          </Button>
        </div>
      </Card>
    </>
  )
}
