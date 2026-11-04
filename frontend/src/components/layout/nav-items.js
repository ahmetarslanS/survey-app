import { BarChart3, CirclePlus, FileText, HelpCircle, Home, LayoutTemplate, Users } from 'lucide-react'

export const NAV_GROUPS = [
  {
    title: 'Benim Alanım',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: Home },
      { to: '/surveys', label: 'Anketlerim', icon: FileText, end: true },
      { to: '/surveys/new', label: 'Anket Oluştur', icon: CirclePlus },
      { to: '/templates', label: 'Şablonlar', icon: LayoutTemplate },
    ],
  },
  {
    title: 'Analiz',
    items: [
      { to: '/reports', label: 'Raporlar', icon: BarChart3 },
      { to: '/participants', label: 'Katılımcı Listeleri', icon: Users },
    ],
  },
  {
    title: 'Sistem',
    items: [{ to: '/help', label: 'Destek', icon: HelpCircle }],
  },
]
