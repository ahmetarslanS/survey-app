# Survey Tool — Proje Rehberi

DefineX için kurum içi/dışı anket hazırlama, tokenlı link ile dağıtma ve raporlama uygulaması.
Gereksinimler: `Survey_Tool_Analiz_v1.0.pdf` (BRD/SRS: FR-xx, BR-xx, NFR-xx, ekranlar S-01..S-10).
Tasarım referansı: `survey_tool_ekranlar_tasarım.html` (prototip). Arayüz dili Türkçe.

**Görev takibi: [TASKS.md](TASKS.md).** Yeni bir işe başlamadan önce oku. İş bitince veya kapsam değişince güncelle: maddeyi
"Yapılacaklar"dan "Tamamlananlar"a taşı, tarih ekle, yeni çıkan işleri ekle.

## Çalışma kuralları

- Kullanıcı feature kodunu çoğunlukla **kendisi yazar**. "X ile devam edelim", "endpointleri listele" gibi isteklerde
  yalnızca liste/plan/yönlendirme ver. Kodu ancak açıkça "yaz / oluştur / düzelt" denince yaz.
- Kullanıcı açıkça istemedikçe commit atma.
- Kullanıcıyla Türkçe konuş.

## Repo yapısı

```
survey/
  backend/    Spring Boot 4.1.2, Java 21, Gradle, PostgreSQL, Lombok
  frontend/   Vite + React 19 (JavaScript) + React Router 7 + Tailwind v4 + shadcn/ui (Radix)
  CLAUDE.md, TASKS.md
```

## Çalıştırma

- **Node/npm:** fnm ile kurulu (v26). Yeni PowerShell oturumunda PATH'te değildir. Her komutun başında şunu çalıştır:
  `fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression; fnm use default`
- **Frontend:** `cd frontend; npm run dev` → http://localhost:5173 · `npm run build` · `npm run lint` (oxlint)
- **Backend:** `cd backend; .\gradlew.bat bootRun` → http://localhost:8080
  - PostgreSQL `localhost:5432/dfx_survey_db`, kullanıcı `dfx_user`
  - `spring.jpa.hibernate.ddl-auto=create`: **her başlatmada tablolar silinir.**
  - Gmail SMTP tanımlı, anket gönderiminde katılımcılara **gerçek mail gider**. Gerçek mail istemiyorsan
    `$env:APP_MAIL_ENABLED='false'` ile başlat: davet mailleri `backend/build/mail-outbox/*.html` dosyalarına yazılır,
    katılımcı linkini oradan alabilirsin.
- Backend'de CORS yok. Frontend istekleri Vite proxy'si ile gider: `/api/*` → `localhost:8080/*`.
- **Sırlar (repo public!):** şifreler/anahtarlar `application.properties`'te tutulmaz. Yerelde
  `backend/application-local.properties` (git dışı; şablon `backend/application-local.example.properties`), sunucuda
  ortam değişkenleri: `DB_PASSWORD`, `MAIL_PASSWORD`, `JWT_SECRET` (≥32 karakter), `ADMIN_PASSWORD`. Bu dosyaya veya
  repoya gerçek şifre, token, secret **yazma**; CLAUDE.md/TASKS.md dahil.
- **Dev giriş:** `admin@teamdefinex.com`, şifresi `application-local.properties` içindeki `app.auth.initial-admin.password`.
  DB boşken açılışta oluşturulur. 5 hatalı denemede hesap 15 dk kilitlenir; dev'de backend'i yeniden başlatmak kilidi
  sıfırlar (`ddl-auto=create`).

## Backend

Paket kökü: `backend/src/main/java/com/example/demo/`
`controllers/admin`, `controllers/auth`, `service` (+`impl`), `dao/entity`, `dao/repository`, `dao/projection`, `dto`,
`exception` (`GlobalExceptionHandler` → `ErrorResponse`), `security`, `util` (`ParticipantCsvParser`, `SurveyReportCsvWriter`).

### Güvenlik (JWT)

- `security/SecurityConfig`: Spring Security + `oauth2-resource-server`, stateless, CSRF kapalı.
  `POST /admin/auth/login` açık; `/admin/**` → `ADMIN` veya `SYSTEM_ADMIN` rolü; `/user/**` açık (katılımcılar davet tokenı ile gelir).
- JWT HS256, `JwtService` üretir. Claim'ler: `sub` (userId), `email`, `name`, `role`, `iss`, `exp`. Controller'da kullanıcı:
  `@AuthenticationPrincipal Jwt jwt` → `Long.valueOf(jwt.getSubject())`.
- Ayarlar `AuthProperties` (`app.auth.*`): `jwt-secret` (≥32 byte, üretimde `JWT_SECRET`), `token-ttl=30m`,
  `max-failed-attempts=5`, `lock-duration=15m`, `initial-admin.*`.
- 401/403 cevapları `RestAuthenticationEntryPoint` / `RestAccessDeniedHandler` ile `GlobalExceptionHandler`'a devredilir,
  yani diğer hatalarla aynı `ErrorResponse` formatındadır. Hatalı giriş → 401 genel mesaj, kilitli hesap → 423.
- `User` entity'si `app_user` tablosunda (`user` PostgreSQL'de ayrılmış kelime).

### Katılımcı davet tokenı

- Anket oluşturulurken her katılımcıya `InvitationTokenService` ile 256 bit token üretilir; DB'de yalnızca SHA-256
  (`SurveyParticipant.tokenHash`). Ham token sadece davet mailindeki linkte: `{app.invitation.base-url}/survey/{id}?token=...`.
  **Token ve e-posta loglanmaz (NFR-43).**
- Katılımcı uç noktaları `controllers/participant/ParticipantSurveyController`, token `X-Survey-Token` başlığında.
  Hatalar `InvitationAccessException.Reason` → `ErrorResponse.code`: `INVITATION_INVALID` 404, `SURVEY_EXPIRED` 410,
  `ALREADY_ANSWERED` 409. Frontend bu kodları `/access-error?reason=` ile eşler.
- Token **nihai gönderimde** tüketilir (`invitationStatus=COMPLETED`, `isResponded=true`); gönderime kadar aynı link açılabilir.
  Geçerlilik ayrıca saklanmaz, anketin bitiş tarihi/durumundan türetilir.
- Davet durumu `InvitationStatus`: CREATED, SENT, FAILED, STARTED, COMPLETED, CANCELLED.
- Anonim ankette `SurveySubmission.participant` null (BR-06).
- `/user/**` için `ParticipantRateLimitFilter` (IP başına dakikada `app.invitation.rate-limit-per-minute`, 429 `RATE_LIMITED`).
- Mail: `MailService.sendInvitation(survey, recipient, link)`, alıcı başına ayrı mail, `app.mail.max-attempts` deneme.

- **Enumlar:** `Status` DRAFT/LIVE/CLOSED/OUTDATED, `QuestionType` LIKERT/SINGLE_CHOICE/MULTIPLE_CHOICE/FREETEXT.
  İkisi de `description` alanında Türkçe etiket taşır.
- **Entity'ler:** Survey, Question, Answer, SurveyParticipant, SurveySubmission, SubmissionAnswer, SurveyTemplate,
  TemplateQuestion, TemplateAnswer, User. **Ayrı Section tablosu yok**: sorular düz liste, bölüm adı `Question.sectionTitle`;
  bölümler ardışık aynı `sectionTitle`'lı sorulardan kurulur (sıra `questionOrder`).
- **Liste sayaçları:** `Survey.participantCount` / `responseCount` Anketlerim listesi için önceden hesaplanır.
  `participantCount` `applyContent`'te set edilir; `responseCount` yalnızca `SurveyRepository.incrementResponseCount`
  (native atomik UPDATE) ile artar, entity'de `updatable=false`. Katılımcı/yanıt ekleyen yeni bir akış yazarsan sayaçları da
  güncelle. Rapor endpointi sayıları canlı hesaplar.
- **Anket akışı:** taslak kaydet (DRAFT, token/mail yok) → düzenle → `/send` (LIVE + tokenlar + mail). Yayındaki ankette
  soru yapısı değişmez (BR-04); yalnızca bitiş tarihi/durum `PATCH` ile.
- **API sözleşmesi:** `backend/api-docs.yaml` (OpenAPI). Dokümandaki bazı endpointler henüz yazılmadı, durumları TASKS.md'de.
- Kayıt DTO'ları `record`, diğerleri Lombok `@Data`. Tarihler `LocalDateTime` (saat dilimi Europe/Istanbul varsayılır).

### Mevcut endpointler

| Method | Path | Not |
| --- | --- | --- |
| POST | `/admin/auth/login` | `{ email, password }` → `{ token, tokenType, expiresAt, user }` (açık) |
| POST | `/admin/auth/refresh` | Geçerli token ile yeni token |
| GET | `/admin/auth/me` | `AuthUserResponse` |
| GET | `/user/surveys/{id}` | Katılımcı, `X-Survey-Token`. `ParticipantSurveyResponse` (+ `draftAnswers`) |
| PUT | `/user/surveys/{id}/draft` | Katılımcı ara kayıt (JSON nesnesi) → 204 |
| POST | `/user/surveys/{id}/responses` | Katılımcı gönderim `{ answers: [{ questionId, optionIds \| text }] }` → 204 |
| POST | `/admin/surveys` | JSON veya multipart (`request` + `participantFile` CSV). Anketi doğrudan **LIVE** oluşturur, mail atar (frontend kullanmıyor) |
| POST | `/admin/surveys/drafts` | `CreateSurveyRequest` → **DRAFT** kaydeder, mail yok, 201 + id. Yalnızca başlık zorunlu |
| PUT | `/admin/surveys/{id}/draft` | Taslağın tüm içeriğini (sorular, katılımcılar) baştan yazar. Yalnızca DRAFT |
| GET | `/admin/surveys/{id}` | `SurveyDetailResponse` (sorular `sectionTitle` ile, katılımcı mailleri) |
| POST | `/admin/surveys/{id}/send` | DRAFT → LIVE, tokenlar + davet mailleri → `SendSurveyResponse` (sent/failed sayıları) |
| DELETE | `/admin/surveys/{id}` | Yalnızca DRAFT |
| GET | `/admin/surveys` | `AdminSurveyListResponse[]` (taslaklar dahil) |
| PATCH | `/admin/surveys/{id}` | `{ status?, endDate? }` — DRAFT için reddedilir (gönderim `/send` ile) |
| GET | `/admin/surveys/{id}/reports` | `SurveyReportResponse` |
| GET | `/admin/surveys/{id}/export/csv` | UTF-8 CSV |
| POST | `/admin/templates/from-survey/{surveyId}` | `{ name, description }` |
| GET | `/admin/templates`, `/admin/templates/{id}` | |
| POST | `/admin/templates/{id}/surveys` | `{ title, description, endDate, isAnonymous }` → surveyId |
| DELETE | `/admin/templates/{id}` | |

## Frontend

`frontend/src/`:
- `components/shadcnui/<ad>/<ad>.jsx` + `index.js`: **her shadcn bileşeni kendi klasöründe.** Yeni bileşen de bu
  düzende eklenir (`components.json` → ui alias `@/components/shadcnui`). Import: `@/components/shadcnui/button`.
- `components/common` (PageHeader, StatusBadge, IconButton, ConfirmDialog, StateCard, FormField...),
  `components/layout` (RootLayout, AdminLayout, PublicLayout, Sidebar, ProtectedRoute, nav-items),
  `components/survey` (diyaloglar, sürükle-bırak kartları), `components/report`.
- `pages/`: her ekran bir page (`*Page.jsx`, default export). Rotalar `router/index.jsx` içinde (`createBrowserRouter`).
- `services/http.js`: tek fetch sarmalayıcı (Bearer token, `ApiError`, 401 → logout eventi, `downloadFile`).
  `session` token + kullanıcıyı saklar ("Beni hatırla" açıksa localStorage, değilse sessionStorage).
- `context/AuthContext.jsx`: login/logout; aktif kullanıcıda token bitime 5 dk kala `/admin/auth/refresh` ile yenilenir,
  30 dk hareketsizlikte oturum kapanır (FR-02).
  Servisler: `surveyService`, `templateService`, `participantService`, `authService`.
- `lib/`: `constants` (tip/durum etiketleri), `format` (tarih/yüzde), `surveyDraft` (builder taslağı ↔ CreateSurveyRequest),
  `csv` (katılımcı CSV ayrıştırma), `answers`. `hooks/use-fetch.js`. `context/AuthContext.jsx`.
- Alias `@` → `src`. Tema renkleri `src/index.css` içinde (primary `#1E4FD8`, font Inter).

### Rotalar

`/login` · `/surveys` · `/surveys/new` · `/surveys/:surveyId/edit` · `/surveys/:surveyId/report` · `/templates` · `/reports` · `/dashboard`,
`/participants`, `/help` (yer tutucu) · `/survey-preview` (builder önizlemesi; oturum istemez, yalnızca localStorage'daki
taslağı gösterir) · katılımcı: `/survey/:surveyId?token=...`,
`/thanks`, `/access-error?reason=expired|answered|invalid`

### Frontend ↔ backend uyarlamaları

- Şablon kullanımı: `/surveys/new?template={id}` → `GET /admin/templates/{id}` builder taslağına yüklenir (`templateToDraft`),
  düzenlenip `POST /admin/surveys` ile gönderilir.
- PDF rapor önyüzde üretilir (backend'de PDF yok): `lib/pdf/SurveyReportDocument.jsx` (react-pdf dokümanı, Inter TTF
  `@expo-google-fonts/inter`'den gömülü — standart PDF fontları ğ/ş/ı/İ içermez) + `exportSurveyReportPdf.jsx`
  (react-pdf'i dinamik import ile yükler). CSV ise backend'den (`/export/csv`).
- Builder (`SurveyBuilderPage`): `/surveys/new` (yeni / `?template=`), `/surveys/{id}/edit` (kayıtlı taslak). "Taslağı Kaydet"
  → `drafts` / `PUT draft`; "Gönder" → önce kaydet, sonra `/send`. Router builder'ı `surveyId ?? 'new'` ile anahtarlar
  (rota değişince state sıfırlanır). Önizleme yeni sekmede (`savePreview` localStorage).
- Taslak ↔ istek dönüşümleri `lib/surveyDraft.js`: `toCreateRequest`, `detailToDraft`, `templateToDraft`, `validateForSave`,
  `validateForSend`.
- Listedeki "Düzenle" yalnızca bitiş tarihini günceller (PATCH). Soru düzenleme endpointi yok.
- Katılımcı CSV'si istemcide ayrıştırılır, JSON `participantMails` olarak gönderilir.
- Katılımcı formu (`SurveyFormPage` + `participantService`) backend'e bağlı. Yanıtlar formda `{ [questionId]: seçenek order'ı |
  order dizisi | metin }` olarak tutulur; bu nesne olduğu gibi ara kayda gider, gönderimde `buildSubmitPayload` ile
  `optionIds`'e çevrilir. Backend bölüm tutmadığı için formda tek bölüm gösterilir.
