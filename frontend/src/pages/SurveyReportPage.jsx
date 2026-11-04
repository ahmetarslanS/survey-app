import { CalendarDays, Clock, Download, Lock, Send, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/shadcnui/button'
import { Skeleton } from '@/components/shadcnui/skeleton'
import { KpiCard } from '@/components/report/KpiCard'
import { QuestionReportCard } from '@/components/report/QuestionReportCard'
import { useFetch } from '@/hooks/use-fetch'
import { formatDateTime, formatPercent, formatScore } from '@/lib/format'
import { exportSurveyReportPdf } from '@/lib/pdf/exportSurveyReportPdf'
import { surveyService } from '@/services/surveyService'

export default function SurveyReportPage() {
  const { surveyId } = useParams()
  const { data: report, error, loading, reload } = useFetch(() => surveyService.getReport(surveyId), [surveyId])
  const [exporting, setExporting] = useState(null)

  async function runExport(kind) {
    setExporting(kind)
    try {
      // CSV backend'den gelir; PDF ekrandaki rapor verisinden önyüzde üretilir
      if (kind === 'csv') await surveyService.exportCsv(surveyId)
      else await exportSurveyReportPdf(report)
    } catch (e) {
      toast.error(kind === 'pdf' ? 'PDF oluşturulamadı. Lütfen tekrar deneyin.' : e.message)
      if (kind === 'pdf') console.error(e)
    } finally {
      setExporting(null)
    }
  }

  const breadcrumb = [{ label: 'Anketlerim', to: '/surveys' }, { label: 'Rapor' }]

  if (error) {
    return (
      <>
        <PageHeader title="Anket Raporu" breadcrumb={breadcrumb} />
        <ErrorState error={error} onRetry={reload} title="Rapor yüklenemedi" />
      </>
    )
  }

  if (loading || !report) {
    return (
      <>
        <PageHeader title="Anket Raporu" breadcrumb={breadcrumb} />
        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </>
    )
  }

  const waiting = Math.max(0, (report.participantCount ?? 0) - (report.responseCount ?? 0))
  const questions = [...(report.questionReports ?? [])].sort((a, b) => a.questionOrder - b.questionOrder)

  return (
    <>
      <PageHeader
        breadcrumb={breadcrumb}
        title={report.title}
        meta={
          <>
            <StatusBadge status={report.status} />
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-subtle" />
              Bitiş: {formatDateTime(report.endDate)}
            </span>
          </>
        }
        actions={
          <>
            <Button variant="outline" disabled={exporting === 'csv'} onClick={() => runExport('csv')}>
              <Download />
              CSV İndir
            </Button>
            <Button disabled={exporting === 'pdf'} onClick={() => runExport('pdf')}>
              <Download />
              Export PDF
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard hero icon={TrendingUp} label="Memnuniyet Ortalaması" value={formatScore(report.satisfactionAverage)} hint="5 üzerinden" />
        <KpiCard icon={TrendingUp} label="Katılım Oranı" value={formatPercent(report.participationRate)} />
        <KpiCard
          icon={Send}
          label="Davet / Yanıt"
          value={`${report.participantCount ?? 0} / ${report.responseCount ?? 0}`}
          hint={`${waiting} kişi bekleniyor`}
        />
        <KpiCard icon={Clock} label="Ort. Tamamlama" value={report.averageCompletionTimeText ?? '—'} />
      </div>

      {report.isAnonymous && (
        <p className="mb-4 flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Lock className="size-3.5" />
          Anonim anket · kişi bazlı yanıt gösterilmez
        </p>
      )}

      {questions.length === 0 && <p className="text-muted-foreground">Bu ankette soru bulunmuyor.</p>}
      {questions.map((q, i) => (
        <QuestionReportCard key={q.questionId} report={q} index={i} />
      ))}
    </>
  )
}
