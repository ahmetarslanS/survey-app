import { Check } from 'lucide-react'

import { StateCard } from '@/components/common/StateCard'

/** S-09: gönderim sonrası teşekkür ekranı */
export default function ThanksPage() {
  return (
    <div className="mt-8">
      <StateCard icon={Check} tone="success" title="Cevaplarınız başarıyla gönderildi.">
        Zaman ayırdığınız için teşekkür ederiz. Geri bildiriminiz değerlendirilecektir. Bu sayfayı kapatabilirsiniz.
      </StateCard>
    </div>
  )
}
