import { BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { StateCard } from '@/components/common/StateCard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/shadcnui/button'
import { Card } from '@/components/shadcnui/card'
import { Skeleton } from '@/components/shadcnui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcnui/table'
import { useFetch } from '@/hooks/use-fetch'
import { formatDate, formatPercent } from '@/lib/format'
import { surveyService } from '@/services/surveyService'

/** Raporu görüntülenebilir (taslak olmayan) anketlerin listesi */
export default function ReportsPage() {
  const { data, error, loading, reload } = useFetch(() => surveyService.list())
  const rows = (data ?? []).filter((s) => s.status !== 'DRAFT')

  return (
    <>
      <PageHeader title="Raporlar" />
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : rows.length === 0 ? (
        <StateCard icon={BarChart3} title="Henüz rapor yok">
          Yayınlanan anketlerin raporları burada listelenir.
        </StateCard>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Anket</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Bitiş Tarihi</TableHead>
                <TableHead>Katılım</TableHead>
                <TableHead className="text-right">Rapor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.title}</TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell>{formatDate(s.endDate)}</TableCell>
                  <TableCell>
                    {s.responseCount}/{s.participantCount} <span className="text-subtle">{formatPercent(s.responseRate)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/surveys/${s.id}/report`}>
                        <BarChart3 />
                        Raporu aç
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  )
}
