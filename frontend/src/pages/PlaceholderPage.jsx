import { Home, HelpCircle, Users } from 'lucide-react'

import { PageHeader } from '@/components/common/PageHeader'
import { StateCard } from '@/components/common/StateCard'

function Placeholder({ title, icon, text }) {
  return (
    <>
      <PageHeader title={title} />
      <StateCard icon={icon} title={title}>
        {text}
      </StateCard>
    </>
  )
}

export function DashboardPage() {
  return (
    <Placeholder
      title="Dashboard"
      icon={Home}
      text="Aktif anketleriniz, yaklaşan bitiş tarihleri ve son yanıtlar burada özetlenecek."
    />
  )
}

export function ParticipantListsPage() {
  return (
    <Placeholder
      title="Katılımcı Listeleri"
      icon={Users}
      text="Sık kullanılan katılımcı gruplarını kaydedip anketlerde tekrar kullanabileceksiniz."
    />
  )
}

export function HelpPage() {
  return (
    <Placeholder
      title="Destek"
      icon={HelpCircle}
      text="Kullanım kılavuzu ve destek talepleri için bu sayfayı kullanabilirsiniz."
    />
  )
}
