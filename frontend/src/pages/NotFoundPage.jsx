import { SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'

import { StateCard } from '@/components/common/StateCard'
import { Button } from '@/components/shadcnui/button'

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24">
      <StateCard
        icon={SearchX}
        tone="warning"
        title="Sayfa bulunamadı"
        actions={
          <Button asChild>
            <Link to="/">Ana sayfaya dön</Link>
          </Button>
        }
      >
        Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.
      </StateCard>
    </div>
  )
}
