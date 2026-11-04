import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { StateCard } from '@/components/common/StateCard'

const REASONS = {
  expired: {
    icon: AlertCircle,
    tone: 'warning',
    title: 'Bu anketin süresi dolmuştur',
    text: 'Anket yanıtlara kapanmıştır. Bir sorun olduğunu düşünüyorsanız anket sahibiyle iletişime geçebilirsiniz.',
  },
  answered: {
    icon: CheckCircle2,
    tone: 'success',
    title: 'Bu anketi zaten yanıtladınız',
    text: 'Yanıtınız daha önce alındı. Her katılımcı ankete yalnızca bir kez yanıt gönderebilir.',
  },
  invalid: {
    icon: XCircle,
    tone: 'danger',
    title: 'Geçersiz bağlantı',
    text: 'Bu bağlantı geçersiz veya iptal edilmiş. Size iletilen e-postadaki bağlantıyı kullandığınızdan emin olun ya da anket sahibiyle iletişime geçin.',
  },
}

/** S-10: süresi dolmuş / zaten yanıtlanmış / geçersiz bağlantı. Kullanım: /access-error?reason=expired|answered|invalid */
export default function AccessErrorPage() {
  const [params] = useSearchParams()
  const cfg = REASONS[params.get('reason')] ?? REASONS.invalid
  return (
    <div className="mt-8">
      <StateCard icon={cfg.icon} tone={cfg.tone} title={cfg.title}>
        {cfg.text}
      </StateCard>
    </div>
  )
}
