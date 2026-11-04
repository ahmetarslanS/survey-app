import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/shadcnui/button'
import { Card } from '@/components/shadcnui/card'
import { Input } from '@/components/shadcnui/input'
import { formatPercent, formatScore } from '@/lib/format'

const FREE_TEXT_PAGE_SIZE = 10

function Bars({ options, likert }) {
  const max = Math.max(1, ...options.map((o) => o.selectedCount ?? 0))
  const sorted = [...options].sort((a, b) => a.answerOrder - b.answerOrder)
  return (
    <div className="flex flex-col gap-2.5">
      {sorted.map((o, k) => (
        <div key={o.answerId ?? k} className="grid grid-cols-[110px_1fr_54px] items-center gap-3 text-[13px] md:grid-cols-[170px_1fr_70px]">
          <span className="truncate" title={o.text}>
            {o.text}
          </span>
          <div className="h-[22px] overflow-hidden rounded-md bg-secondary">
            <div
              className="h-full rounded-md bg-primary transition-[width] duration-500"
              style={{
                width: `${((o.selectedCount ?? 0) / max) * 100}%`,
                opacity: likert ? 0.35 + (k / Math.max(1, sorted.length - 1)) * 0.65 : 1,
              }}
            />
          </div>
          <span className="text-right text-muted-foreground">
            <b className="font-semibold text-foreground">{o.selectedCount ?? 0}</b> · {formatPercent(o.selectedRate)}
          </span>
        </div>
      ))}
    </div>
  )
}

function FreeTextList({ answers }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(
    () => answers.filter((a) => a.toLowerCase().includes(query.trim().toLowerCase())),
    [answers, query],
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / FREE_TEXT_PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const visible = filtered.slice((current - 1) * FREE_TEXT_PAGE_SIZE, current * FREE_TEXT_PAGE_SIZE)

  return (
    <div>
      <div className="relative mb-4 w-full md:w-[260px]">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
        <Input
          placeholder="Yanıtlarda ara..."
          className="pl-9"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
        />
      </div>
      <div className="flex flex-col gap-2.5">
        {visible.length === 0 && <p className="text-muted-foreground">Yanıt bulunamadı.</p>}
        {visible.map((text, i) => (
          // React metni kaçış karakterleriyle basar (NFR-05); dangerouslySetInnerHTML kullanılmaz.
          <div key={i} className="rounded-[10px] border bg-[#F9FAFB] px-3.5 py-3 leading-relaxed whitespace-pre-wrap text-[#344054]">
            {text}
          </div>
        ))}
      </div>
      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3 text-muted-foreground">
          <span>
            Sayfa {current} / {pageCount}
          </span>
          <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>
            Önceki
          </Button>
          <Button variant="outline" size="sm" disabled={current >= pageCount} onClick={() => setPage(current + 1)}>
            Sonraki
          </Button>
        </div>
      )}
    </div>
  )
}

const TYPE_LABEL = {
  LIKERT: 'Likert',
  SINGLE_CHOICE: 'Tekli seçim',
  MULTIPLE_CHOICE: 'Çoklu seçim',
  FREETEXT: 'Serbest metin',
}

export function QuestionReportCard({ report, index }) {
  const isLikert = report.type === 'LIKERT'
  const isFree = report.type === 'FREETEXT'

  return (
    <Card className="mb-4 p-5">
      <div className="mb-[18px] flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-secondary text-xs font-semibold">{index + 1}</span>
            <h2 className="text-base font-semibold">{report.questionText}</h2>
          </div>
          <div className="mt-1 text-[13px] text-muted-foreground">
            {TYPE_LABEL[report.type] ?? report.type} · {report.answeredCount ?? 0} yanıt
            {report.isOptional ? ' · Opsiyonel' : ''}
          </div>
        </div>
        {isLikert && report.averageScore != null && (
          <div className="text-right">
            <b className="text-[22px] text-primary">{formatScore(report.averageScore)}</b>
            <small className="block text-xs text-muted-foreground">Ortalama / 5</small>
          </div>
        )}
      </div>

      {isFree ? (
        <FreeTextList answers={report.freeTextAnswers ?? []} />
      ) : (
        <Bars options={report.options ?? []} likert={isLikert} />
      )}
    </Card>
  )
}
