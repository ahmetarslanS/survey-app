# Görev Takibi

Durumlar: `[ ]` yapılacak · `[~]` devam ediyor · `[x]` tamamlandı.
Referanslar analiz dokümanındaki ID'lerdir (FR = fonksiyonel gereksinim, BR = iş kuralı, NFR = fonksiyonel olmayan gereksinim).
Öncelik: **M** (Must), **S** (Should), **C** (Could).

## Devam eden

_(şu an yok)_

## Yapılacaklar

### Güvenlik — acil (kullanıcı aksiyonu)

- [ ] **T-43 Sızan şifreleri yenile**: GitHub reposu public ve ilk commit'ten beri `application.properties` içinde Gmail
  uygulama şifresi ile DB şifresi açık duruyordu. Dosyadan çıkarıldı ama **git geçmişinde hâlâ okunabilir**.
  Gmail uygulama şifresini iptal edip yenisini oluştur, DB şifresini değiştir; yeni değerleri yalnızca
  `backend/application-local.properties`'e yaz. İstenirse geçmiş `git filter-repo` ile temizlenebilir (force push gerekir).

### Backend

#### Admin kimlik doğrulama (JWT)

T-01..T-05 tamamlandı (bkz. Tamamlananlar).

- [ ] **T-06 Sahiplik kontrolü** (M · BR-09): Admin yalnızca kendi anketlerini/şablonlarını görür. Survey ve Template'e
  `owner` (User) ilişkisi eklenir, listeler ve detay/güncelleme işlemleri sahibe göre filtrelenir.
- [ ] **T-07 Şifre sıfırlama** (S · FR-03): süreli, tek kullanımlık sıfırlama linki e-posta ile (token hash olarak saklanır).
- [ ] **T-08 Denetim kaydı** (S · NFR-07): giriş, gönderim, silme, dışa aktarım, tarih uzatma → AuditLog (user, işlem, varlık, zaman, ip).

#### Katılımcı tokenı (davet linki)

T-30..T-37 tamamlandı (bkz. Tamamlananlar). Kalan ilgili işler:

- [ ] **T-39 Asenkron mail kuyruğu** (M · NFR-10): davetler şu an istek içinde, alıcı başına senkron gönderiliyor
  (1.000 katılımcıda istek uzun sürer). Kuyruk/`@Async` + gönderim özeti maili (§9 "Gönderim özeti").
- [ ] **T-40 Tarih uzatma bilgilendirme maili** (S · FR-51, §9): uzatmada linkler zaten yeniden çalışıyor; yanıtlamamış
  katılımcılara opsiyonel "Son tarih uzatıldı" maili gönderilmeli. Yeni token gerekmez ama ham token saklanmadığı için
  maile link koymak için yeni token üretilip hash güncellenmeli (eski link geçersiz olur).
- [ ] **T-41 Bounce takibi** (S · §3.3 "Hata"): SMTP gönderimi başarılı olsa da sonradan geri dönen mailler tespit edilmiyor.
- [ ] **T-42 Anonim yanıtlarda zaman ilişkisi** (BR-06): anonim ankette yanıt kaydı katılımcıya bağlanmıyor, ancak
  `submission.submittedDateTime` ile `participant.respondedDateTime` aynı an olduğu için DB erişimi olan biri eşleştirebilir.
  Gerekirse anonim modda zamanlar yuvarlanmalı / ayrıştırılmalı.

#### Diğer

- [ ] **T-09 Otomatik "Süresi Doldu"** (M · FR-52): bitiş tarihi geçen LIVE anketleri en geç 1 dk içinde OUTDATED yapan `@Scheduled` görev.
- [ ] **T-18 CORS / prod yapılandırması** (S · NFR-01): dev'de Vite proxy yeterli, prod için CORS veya reverse proxy.
- [ ] **T-10 Yayındaki ankete katılımcı ekleme** (M · FR-43): yalnızca yeni eklenenlere davet gider.
- [ ] **T-11 Hatırlatma maili** (S · FR-44): yanıt vermeyenlere manuel / bitişten X gün önce otomatik.
- [ ] **T-12 Anket detay + taslak anket** (M · FR-20..27, FR-11): DRAFT oluşturma, anket detayını getirme ve güncelleme
  (builder'da "Düzenle" için gerekli), yayın sonrası yapı kilidi (BR-04, BR-05).
- [ ] **T-13 Bölüm (section) desteği** (M · FR-21): veri modelinde Section yok. Frontend bölümleri düzleştirerek gönderiyor.
- [ ] **T-14 Anket kopyalama / arşivleme / silme** (M · FR-11, BR-08).
- [ ] **T-15 Katılımcı bazında davet durumu ekranı** (S · FR-45): `SurveyParticipant.invitationStatus` hazır;
  admin için listeleme endpointi + ekran gerekli (anonim modda yalnızca tamamlanma durumu, Q-03).
- [ ] **T-17 `ddl-auto=create` → `update` veya migration (Flyway)**: şu an her başlatmada veri siliniyor.

### Frontend

- [ ] **T-21 Anket düzenleme ekranı** (T-12'ye bağlı): `/surveys/:id/edit`.
- [ ] **T-29 "Şifremi unuttum" akışı** (S · FR-03), T-07'ye bağlı. Şu an butona basınca bilgi mesajı çıkıyor.
- [ ] **T-38 `POST /admin/templates/{id}/surveys` kullanılmıyor**: frontend artık şablonu builder'da açıp `POST /admin/surveys`
  ile gönderiyor. Backend endpointi kaldırılabilir ya da DRAFT akışı (T-12) gelince tekrar değerlendirilir.
- [ ] **T-24 Dashboard sayfası**: aktif anketler, yaklaşan bitiş tarihleri, son yanıtlar.
- [ ] **T-25 Rapor bölüm filtresi** (C · FR-75) ve kayıtlı modda katılımcı bazlı yanıtlar (S · FR-74).
- [ ] **T-26 Route bazlı code-splitting**: build çıktısı 650 kB, `lazy` ile bölünebilir.
- [ ] **T-27 Mail şablonu özelleştirme** (S · FR-46): `{ad}`, `{anket_adi}`, `{link}`, `{son_tarih}`.

## Tamamlananlar

### Backend (önceki commitler)

- [x] Anket entity/controller/service iskeleti
- [x] Anket durum + bitiş tarihi güncelleme: `PATCH /admin/surveys/{id}` (FR-51)
- [x] Admin anket oluşturma + davet maili: `POST /admin/surveys` (FR-42, token henüz yok)
- [x] Anket listesi: `GET /admin/surveys` (FR-10)
- [x] Katılımcıları CSV ile yükleme (multipart) (FR-41)
- [x] Anket raporu: `GET /admin/surveys/{id}/reports` (FR-70, FR-71)
- [x] Şablon yönetimi: anketten şablon, listeleme, detay, şablondan anket, silme (FR-12, FR-30, FR-31)
- [x] CSV rapor dışa aktarımı: `GET /admin/surveys/{id}/export/csv` (FR-73)

### 2026-11-04

- [x] Repo `backend/` + `frontend/` olarak ayrıldı (git mv, commitlenmedi)
- [x] Frontend projesi oluşturuldu (Vite + React JS + React Router + Tailwind v4 + shadcn/ui)
- [x] Ekranlar: Giriş (S-01), Anketlerim (S-02), Anket Oluşturma + Yeni Soru / Katılımcılar / Gönderim modalları (S-03..S-06),
  Rapor (S-07), Şablonlar, Raporlar listesi, Katılımcı formu (S-08), Teşekkür (S-09), Erişim hatası (S-10), önizleme
- [x] Sürükle-bırak ile soru ve bölüm sıralama (dnd-kit), kaydedilmemiş değişiklik uyarısı
- [x] Backend + frontend lokalde birlikte çalıştırıldı, proxy doğrulandı
- [x] CLAUDE.md ve TASKS.md oluşturuldu
- [x] **T-01** `User` entity (`app_user` tablosu), `Role` (ADMIN, SYSTEM_ADMIN), `UserStatus`; ilk admin
  `app.auth.initial-admin.*` ile açılışta oluşturuluyor (serbest kayıt yok)
- [x] **T-02** `POST /admin/auth/login` → `{ token, tokenType, expiresAt, user }`. bcrypt, JWT HS256 (`sub`, `email`, `name`,
  `role`, `iss`, `exp`). Hatalı girişte genel mesaj; bilinmeyen e-postada da bcrypt çalıştırılarak süre eşitleniyor
- [x] **T-03** 5 hatalı denemede 15 dk kilit → HTTP 423 (süreler config'ten)
- [x] **T-04** Spring Security (oauth2-resource-server, stateless): `/admin/**` için ADMIN/SYSTEM_ADMIN rolü, `/user/**` açık.
  401/403 cevapları `GlobalExceptionHandler` üzerinden `ErrorResponse` formatında
- [x] **T-05** Token ömrü 30 dk; `POST /admin/auth/refresh`, `GET /admin/auth/me`. Frontend aktif kullanıcı için token'ı
  bitime 5 dk kala yeniliyor, 30 dk hareketsizlikte oturumu kapatıyor (FR-02)
- [x] `AuthServiceImplTest`: 8 birim testi (başarılı giriş, genel mesaj, kilit, süresi biten kilit, pasif kullanıcı)
- [x] **T-22** Frontend gerçek login'e geçti (mock kaldırıldı). "Beni hatırla" kapalıysa token sessionStorage'da tutuluyor
- [x] **T-20** "Bu şablonu kullan" → `/surveys/new?template={id}`: şablon builder'a yükleniyor, sorular düzenlenip
  katılımcı eklenerek `POST /admin/surveys` ile gönderiliyor. `CreateFromTemplateDialog` kaldırıldı
- [x] **T-30** Davet tokenı: 256 bit `SecureRandom`, URL-safe Base64; DB'de yalnızca SHA-256 (`survey_participant.token_hash`).
  Ham token yalnızca maile yazılıyor, loglanmıyor (log kontrol edildi)
- [x] **T-31** Davet maili alıcı başına ayrı gönderiliyor (önceden tek mailde tüm alıcılar birbirini görüyordu); link
  `{app.invitation.base-url}/survey/{id}?token=...`. Başlık/açıklama HTML-escape. `app.mail.enabled=false` → mail
  `build/mail-outbox/` klasörüne .html olarak yazılır (dev)
- [x] **T-32** `InvitationStatus`: CREATED → SENT / FAILED → STARTED → COMPLETED (+ CANCELLED). "Süresi doldu" bitiş
  tarihinden türetiliyor. Mail hatasında 3 deneme (NFR-42)
- [x] **T-33** `GET /user/surveys/{id}` + `X-Survey-Token`: 404 `INVITATION_INVALID`, 410 `SURVEY_EXPIRED`,
  409 `ALREADY_ANSWERED` (`ErrorResponse.code`). İlk açılış `startedDateTime` (tamamlama süresi) ve STARTED
- [x] **T-34** `POST /user/surveys/{id}/responses` `{ answers: [{ questionId, optionIds | text }] }`: zorunlu soru, seçenek
  sahipliği, tek/çoklu seçim, 2000 karakter kontrolleri; satır kilidi ile çift gönderim engeli; token gönderimde tüketiliyor;
  anonim modda `survey_submission.participant_id` boş (BR-06)
- [x] **T-35** `PUT /user/surveys/{id}/draft`: istemcinin taslağı (JSON nesnesi, ≤64 KB) sunucuda; GET'te `draftAnswers`
  olarak dönüyor, gönderimde siliniyor. Taslaklar rapora girmiyor (BR-03)
- [x] **T-36** Token geçerliliği anketin bitiş tarihinden türetiliyor: uzatınca linkler yeniden çalışıyor, kapatınca 410
- [x] **T-37** `/user/**` için IP başına dakikada 120 istek (config), aşımda 429 `RATE_LIMITED`
- [x] **T-23** Katılımcı formu backend'e bağlandı: token ile açma, her sayfa geçişinde sunucuya ara kayıt
  ("Kaydedilemedi" uyarısı), gönderim, hata kodlarına göre `/access-error?reason=`. localStorage kaldırıldı
- [x] `ParticipantSurveyServiceImplTest` (18) + `InvitationTokenServiceTest` (3) birim testi; proxy üzerinden uçtan uca
  test (outbox modunda): davet → aç → taslak → eksik/geçerli gönderim → tekrar erişim 409 → rapor → kapatınca 410 → rate limit
- [x] `api-docs.yaml` katılımcı uç noktaları ve `ErrorResponse.code` ile güncellendi
- [x] OpenPDF bağımlılığı `build.gradle`'dan kaldırıldı (PDF önyüzde üretilecek, T-28)
- [x] **T-28** PDF rapor önyüzde (`@react-pdf/renderer`, `lib/pdf/`): vektörel, metin seçilebilir; Inter TTF gömülü
  (Türkçe karakterler); KPI'lar, soru bazlı çubuklar, Likert ortalaması, serbest metinler, sayfa numarası.
  Seçimli soru kartları sayfa arasında bölünmüyor, uzun serbest metin listeleri sayfalara yayılıyor.
  react-pdf (~445 KB gzip) yalnızca butona basıldığında yükleniyor. Dosya adı CSV ile aynı biçimde
- [x] Sırlar `application.properties`'ten çıkarıldı: DB/mail şifresi, JWT secret ve ilk admin şifresi artık
  `backend/application-local.properties` (git dışı) veya ortam değişkenlerinden okunuyor; JWT secret yeniden üretildi
