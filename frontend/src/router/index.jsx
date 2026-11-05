import { createBrowserRouter, Navigate, useParams } from 'react-router-dom'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { RootLayout } from '@/components/layout/RootLayout'
import AccessErrorPage from '@/pages/AccessErrorPage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import { DashboardPage, HelpPage, ParticipantListsPage } from '@/pages/PlaceholderPage'
import ReportsPage from '@/pages/ReportsPage'
import SurveyBuilderPage from '@/pages/SurveyBuilderPage'
import SurveyFormPage from '@/pages/SurveyFormPage'
import SurveyListPage from '@/pages/SurveyListPage'
import SurveyReportPage from '@/pages/SurveyReportPage'
import TemplatesPage from '@/pages/TemplatesPage'
import ThanksPage from '@/pages/ThanksPage'

/**
 * Aynı bileşen farklı rotalarda yeniden kullanıldığında React state'i korur; /surveys/5/edit'ten "Anket Oluştur"a
 * geçince eski taslak ekranda kalmasın diye builder anket id'sine göre anahtarlanır.
 */
// eslint-disable-next-line react-refresh/only-export-components
function SurveyBuilderRoute() {
  const { surveyId } = useParams()
  return <SurveyBuilderPage key={surveyId ?? 'new'} />
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },

      // Yönetici (Admin) alanı — oturum gerektirir
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: '/', element: <Navigate to="/surveys" replace /> },
              { path: '/dashboard', element: <DashboardPage /> },
              { path: '/surveys', element: <SurveyListPage /> },
              { path: '/surveys/new', element: <SurveyBuilderRoute /> },
              { path: '/surveys/:surveyId/edit', element: <SurveyBuilderRoute /> },
              { path: '/surveys/:surveyId/report', element: <SurveyReportPage /> },
              { path: '/templates', element: <TemplatesPage /> },
              { path: '/reports', element: <ReportsPage /> },
              { path: '/participants', element: <ParticipantListsPage /> },
              { path: '/help', element: <HelpPage /> },
            ],
          },
        ],
      },

      // Katılımcı alanı — hesap gerektirmez, e-postadaki tokenlı link ile erişilir
      {
        element: <PublicLayout />,
        children: [
          // Builder'ın yeni sekmede açtığı önizleme. Backend'e istek atmaz, yalnızca bu tarayıcının localStorage'ındaki
          // taslağı gösterir; bu yüzden oturum gerektirmez. (Oturum "Beni hatırla" kapalıyken sessionStorage'dadır ve
          // yeni sekmeye her zaman taşınmaz; korumalı rota önizlemeyi login'e yönlendirebilirdi.)
          { path: '/survey-preview', element: <SurveyFormPage preview /> },
          { path: '/survey/:surveyId', element: <SurveyFormPage /> },
          { path: '/thanks', element: <ThanksPage /> },
          { path: '/access-error', element: <AccessErrorPage /> },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
