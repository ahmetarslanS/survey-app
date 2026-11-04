import { Badge } from '@/components/shadcnui/badge'
import { SURVEY_STATUS } from '@/lib/constants'

export function StatusBadge({ status }) {
  const cfg = SURVEY_STATUS[status] ?? { label: status ?? '—', variant: 'secondary' }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
