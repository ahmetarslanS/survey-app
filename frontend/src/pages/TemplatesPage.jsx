import { LayoutTemplate, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ErrorState } from '@/components/common/ErrorState'
import { IconButton } from '@/components/common/IconButton'
import { PageHeader } from '@/components/common/PageHeader'
import { StateCard } from '@/components/common/StateCard'
import { Button } from '@/components/shadcnui/button'
import { Card } from '@/components/shadcnui/card'
import { Skeleton } from '@/components/shadcnui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/shadcnui/tabs'
import { useFetch } from '@/hooks/use-fetch'
import { formatDate } from '@/lib/format'
import { templateService } from '@/services/templateService'

export default function TemplatesPage() {
  const navigate = useNavigate()
  const { data, error, loading, reload } = useFetch(() => templateService.list())
  const [dialog, setDialog] = useState(null) // { type: 'delete', template }

  return (
    <>
      <Tabs value="templates">
        <TabsList>
          <TabsTrigger value="surveys" onClick={() => navigate('/surveys')}>
            Anketlerim
          </TabsTrigger>
          <TabsTrigger value="templates">Şablonlar</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-5" />
      <PageHeader
        title="Şablonlar"
        actions={
          <Button asChild>
            <Link to="/surveys/new">
              <Plus />
              Yeni Anket
            </Link>
          </Button>
        }
      />

      {error ? (
        <ErrorState error={error} onRetry={reload} title="Şablonlar yüklenemedi" />
      ) : loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : data?.length === 0 ? (
        <StateCard icon={LayoutTemplate} title="Henüz şablon yok">
          Anketler listesinden bir anketin “Şablon olarak kaydet” seçeneğiyle şablon oluşturabilirsiniz.
        </StateCard>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {data.map((t) => (
            <Card key={t.id} className="gap-2.5 p-[18px]">
              <div className="flex items-start justify-between">
                <div className="grid size-8 place-items-center rounded-lg bg-accent text-primary">
                  <LayoutTemplate className="size-4" />
                </div>
                <IconButton icon={Trash2} label="Şablonu sil" danger onClick={() => setDialog({ type: 'delete', template: t })} />
              </div>
              <h2 className="text-base font-semibold">{t.name}</h2>
              {t.description && <p className="line-clamp-2 text-[13px] text-muted-foreground">{t.description}</p>}
              <span className="text-muted-foreground">
                {t.questionCount ?? 0} soru · {formatDate(t.createdDateTime)}
              </span>
              <Button variant="outline" className="mt-1.5" onClick={() => navigate(`/surveys/new?template=${t.id}`)}>
                Bu şablonu kullan
              </Button>
            </Card>
          ))}
        </div>
      )}

      {dialog?.type === 'delete' && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setDialog(null)}
          destructive
          title="Şablon silinsin mi?"
          description={`"${dialog.template.name}" silinir. Bu şablondan üretilmiş anketler etkilenmez.`}
          confirmLabel="Sil"
          onConfirm={async () => {
            await templateService.remove(dialog.template.id)
            toast.success('Şablon silindi')
            reload()
          }}
        />
      )}
    </>
  )
}
