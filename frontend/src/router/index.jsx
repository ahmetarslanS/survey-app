import { createBrowserRouter, Navigate } from 'react-router-dom'

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
              { path: '/surveys/new', element: <SurveyBuilderPage /> },
              { path: '/surveys/:surveyId/report', element: <SurveyReportPage /> },
              { path: '/templates', element: <TemplatesPage /> },
              { path: '/reports', element: <ReportsPage /> },
              { path: '/participants', element: <ParticipantListsPage /> },
              { path: '/help', element: <HelpPage /> },
            ],
          },
          // Önizleme yalnızca oturum açmış yöneticiye açık
          {
            element: <PublicLayout />,
            children: [{ path: '/survey-preview', element: <SurveyFormPage preview /> }],
          },
        ],
      },

      // Katılımcı alanı — hesap gerektirmez, e-postadaki tokenlı link ile erişilir
      {
        element: <PublicLayout />,
        children: [
          { path: '/survey/:surveyId', element: <SurveyFormPage /> },
          { path: '/thanks', element: <ThanksPage /> },
          { path: '/access-error', element: <AccessErrorPage /> },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
