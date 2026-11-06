# Survey Tool — Frontend

Vite + React (JavaScript) + React Router + Tailwind CSS v4 + shadcn/ui (Radix).

## Çalıştırma

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
```

Backend `http://localhost:8080` üzerinde çalışmalıdır (`cd backend && ./gradlew bootRun`).
Backend'de CORS tanımlı olmadığı için tarayıcı istekleri Vite dev proxy'si üzerinden gider:
`/api/admin/surveys` → `http://localhost:8080/admin/surveys` ([vite.config.js](vite.config.js)).

### Ortam değişkenleri

| Değişken | Açıklama |
| --- | --- |
| `VITE_API_BASE_URL` | API kök yolu (varsayılan `/api`) |

Giriş backend'deki `POST /admin/auth/login` (JWT) ile yapılır. Dev hesabı `admin@teamdefinex.com`; şifresi
`backend/application-local.properties` içindeki `app.auth.initial-admin.password` değeridir.

## Klasör yapısı

```
src/
  components/
    shadcnui/<component>/    # shadcn/ui bileşenleri — her biri kendi klasöründe (<component>.jsx + index.js)
    common/                  # uygulama genelinde paylaşılan küçük bileşenler (PageHeader, StatusBadge, ...)
    layout/                  # AdminLayout, PublicLayout, Sidebar, ProtectedRoute, RootLayout
    survey/                  # anket diyalogları ve sürükle-bırak kartları
    report/                  # rapor bileşenleri
  pages/                     # route'lara karşılık gelen sayfalar
  router/                    # createBrowserRouter tanımı
  services/                  # API istemcisi (http.js) ve servisler
  context/                   # AuthContext
  hooks/  lib/               # yardımcılar, sabitler, taslak/CSV mantığı
```

## Sayfalar ve rotalar

| Ekran | Rota | Sayfa |
| --- | --- | --- |
| S-01 Giriş | `/login` | `LoginPage` |
| S-02 Anketlerim | `/surveys` | `SurveyListPage` |
| S-03/04/05/06 Anket oluşturma + modallar | `/surveys/new`, `/surveys/:surveyId/edit` (taslak) | `SurveyBuilderPage` |
| S-07 Rapor | `/surveys/:surveyId/report` | `SurveyReportPage` |
| Şablonlar | `/templates` | `TemplatesPage` |
| Raporlar | `/reports` | `ReportsPage` |
| S-08 Anket formu | `/survey/:surveyId?token=...` | `SurveyFormPage` |
| Yönetici önizlemesi | `/survey-preview` | `SurveyFormPage` (preview) |
| S-09 Teşekkür | `/thanks` | `ThanksPage` |
| S-10 Erişim hatası | `/access-error?reason=expired\|answered\|invalid` | `AccessErrorPage` |

## shadcn/ui bileşeni ekleme

`components.json` içinde `ui` alias'ı `@/components/shadcnui` olarak ayarlıdır. CLI bileşeni düz dosya olarak
bırakırsa (`shadcnui/<name>.jsx`) `shadcnui/<name>/<name>.jsx` olarak taşıyıp bir `index.js` ekleyin.
