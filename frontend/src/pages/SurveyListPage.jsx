import {
  ArrowUpDown,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutTemplate,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ErrorState } from '@/components/common/ErrorState'
import { IconButton } from '@/components/common/IconButton'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/shadcnui/button'
import { Card } from '@/components/shadcnui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/shadcnui/dropdown-menu'
import { Input } from '@/components/shadcnui/input'
import { Progress } from '@/components/shadcnui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcnui/select'
import { Skeleton } from '@/components/shadcnui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcnui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/shadcnui/tabs'
import { SaveTemplateDialog } from '@/components/survey/SaveTemplateDialog'
import { UpdateSurveyDialog } from '@/components/survey/UpdateSurveyDialog'
import { useFetch } from '@/hooks/use-fetch'
import { STATUS_FILTER_OPTIONS } from '@/lib/constants'
import { formatDate, formatPercent } from '@/lib/format'
import { surveyService } from '@/services/surveyService'

const PAGE_SIZES = ['10', '20', '50']

function SortHead({ label, field, sort, onSort }) {
  return (
    <button className="inline-flex items-center gap-1.5 font-medium" onClick={() => onSort(field)}>
      {label}
      <ArrowUpDown className={`size-3.5 ${sort.field === field ? 'text-primary' : 'text-subtle'}`} />
    </button>
  )
}

export default function SurveyListPage() {
  const navigate = useNavigate()
  const { data, error, loading, reload } = useFetch(() => surveyService.list())

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const [sort, setSort] = useState({ field: null, dir: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState('20')

  // Aynı anda tek bir diyalog açık olur: { type: 'update' | 'template' | 'close', survey }
  const [dialog, setDialog] = useState(null)

  const rows = useMemo(() => {
    let list = (data ?? []).filter(
      (s) => s.title?.toLowerCase().includes(query.trim().toLowerCase()) && (status === 'ALL' || s.status === status),
    )
    if (sort.field) {
      const dir = sort.dir === 'asc' ? 1 : -1
      list = [...list].sort((a, b) => {
        const av = a[sort.field] ?? ''
        const bv = b[sort.field] ?? ''
        return (av > bv ? 1 : av < bv ? -1 : 0) * dir
      })
    }
    return list
  }, [data, query, status, sort])

  const size = Number(pageSize)
  const pageCount = Math.max(1, Math.ceil(rows.length / size))
  const current = Math.min(page, pageCount)
  const visible = rows.slice((current - 1) * size, current * size)

  const toggleSort = (field) =>
    setSort((s) => (s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' }))

  async function exportCsv(id) {
    try {
      await surveyService.exportCsv(id)
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <>
      <Tabs value="surveys" className="mb-0">
        <TabsList>
          <TabsTrigger value="surveys">Anketlerim</TabsTrigger>
          <TabsTrigger value="templates" onClick={() => navigate('/templates')}>
            Şablonlar
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-5" />
      <PageHeader
        title="Anketlerim"
        actions={
          <Button variant="outline" asChild>
            <Link to="/templates">
              <LayoutTemplate />
              Şablondan Oluştur
            </Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative w-[380px] max-w-full">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
          <Input
            placeholder="Anket ara..."
            className="pl-9"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[170px]" aria-label="Duruma göre filtrele">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button asChild>
          <Link to="/surveys/new">
            <Plus />
            Yeni Anket
          </Link>
        </Button>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} title="Anketler yüklenemedi" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>
                  <SortHead label="Anket" field="title" sort={sort} onSort={toggleSort} />
                </TableHead>
                <TableHead>
                  <SortHead label="Durum" field="status" sort={sort} onSort={toggleSort} />
                </TableHead>
                <TableHead>
                  <SortHead label="Bitiş Tarihi" field="endDate" sort={sort} onSort={toggleSort} />
                </TableHead>
                <TableHead>Yanıt / Katılımcı</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, k) => (
                      <TableCell key={k}>
                        <Skeleton className="h-5 w-full max-w-[160px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading && visible.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    {data?.length ? 'Aramanızla eşleşen anket bulunamadı.' : 'Henüz anket oluşturmadınız.'}
                  </TableCell>
                </TableRow>
              )}

              {visible.map((s) => {
                const pct = Math.round(Number(s.responseRate) || 0)
                const isDraft = s.status === 'DRAFT'
                const isClosed = s.status === 'CLOSED'
                return (
                  <TableRow key={s.id}>
                    <TableCell className="py-[18px] font-medium">
                      {s.title}
                      {s.description && (
                        <div className="mt-0.5 max-w-[360px] truncate text-xs font-normal text-muted-foreground">
                          {s.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 text-[#475467]">
                        <CalendarDays className="size-4 text-subtle" />
                        {formatDate(s.endDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {s.participantCount ? (
                        <div className="flex items-center gap-2.5 text-[#475467]">
                          <Progress value={pct} className="w-[120px]" />
                          {s.responseCount}/{s.participantCount}
                          <span className="text-subtle">{formatPercent(s.responseRate)}</span>
                        </div>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <IconButton
                          icon={BarChart3}
                          label="Sonuçlar"
                          disabled={isDraft}
                          onClick={() => navigate(`/surveys/${s.id}/report`)}
                        />
                        <IconButton
                          icon={Pencil}
                          label="Bitiş tarihini güncelle"
                          disabled={isClosed}
                          onClick={() => setDialog({ type: 'update', survey: s })}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Diğer işlemler">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setDialog({ type: 'template', survey: s })}>
                              <LayoutTemplate />
                              Şablon olarak kaydet
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled={isDraft} onSelect={() => exportCsv(s.id)}>
                              <Download />
                              Sonuçları CSV indir
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              destructive
                              disabled={isClosed}
                              onSelect={() => setDialog({ type: 'close', survey: s })}
                            >
                              <Lock />
                              Anketi kapat
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-5 px-2 pt-5 text-muted-foreground">
        <span>{rows.length} toplam satır</span>
        <div className="flex-1" />
        <b className="font-medium text-foreground">Sayfa başına satır</b>
        <Select
          value={pageSize}
          onValueChange={(v) => {
            setPageSize(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="h-8 w-[76px]" aria-label="Sayfa başına satır">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <b className="font-medium text-foreground">
          Sayfa {current} / {pageCount}
        </b>
        <span className="flex gap-1.5">
          <Button variant="outline" size="sm" aria-label="Önceki sayfa" disabled={current <= 1} onClick={() => setPage(current - 1)}>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Sonraki sayfa"
            disabled={current >= pageCount}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight />
          </Button>
        </span>
      </div>

      {dialog?.type === 'update' && (
        <UpdateSurveyDialog
          key={dialog.survey.id}
          survey={dialog.survey}
          open
          onOpenChange={(o) => !o && setDialog(null)}
          onUpdated={reload}
        />
      )}
      {dialog?.type === 'template' && (
        <SaveTemplateDialog key={dialog.survey.id} survey={dialog.survey} open onOpenChange={(o) => !o && setDialog(null)} />
      )}
      {dialog?.type === 'close' && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setDialog(null)}
          destructive
          title="Anket kapatılsın mı?"
          description={`"${dialog.survey.title}" kapatıldığında yeni yanıt alınmaz ve bu işlem geri alınamaz.`}
          confirmLabel="Anketi kapat"
          onConfirm={async () => {
            await surveyService.update(dialog.survey.id, { status: 'CLOSED' })
            toast.success('Anket kapatıldı')
            reload()
          }}
        />
      )}
    </>
  )
}
