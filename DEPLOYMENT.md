# Deployment (Docker)

Uygulama üç container olarak çalışır:

```
tarayıcı ──► frontend (nginx :80) ──/api/*──► backend (Spring Boot :8080) ──► db (PostgreSQL 17)
              statik React build          /actuator/health yalnızca iç ağda
```

- **frontend:** React build'ini sunar ve `/api/*` isteklerini `/api` önekini atarak backend'e iletir. Geliştirmedeki
  Vite proxy'sinin aynısı olduğu için backend'de CORS gerekmez.
- **backend ve db:** Dışarıya port açmaz. Dışarıdan yalnızca frontend portuna erişilir.
- **Kalıcı veri:** Veritabanı `pgdata` volume'ünde tutulur.

## Gereksinimler

- Docker Engine 24+ ve Docker Compose v2 (`docker compose`). Windows'ta ücretli lisans gerektirmeyen bir seçenek
  [Rancher Desktop](https://rancherdesktop.io/)'tır (Container Engine: `dockerd (moby)`, Kubernetes kapalı).
- Sunucudan SMTP sunucusuna (varsayılan `smtp.gmail.com:587`) çıkış izni
- Davet linkleri için kullanıcıların erişebildiği bir adres (alan adı veya IP)

## İlk kurulum

```bash
git clone <repo> survey && cd survey
cp .env.example .env
# .env içindeki değerleri doldurun (aşağıdaki tablo)
docker compose up -d --build
docker compose ps        # üç servis de "healthy" olmalı
```

Ardından `FRONTEND_URL` adresini açın ve `ADMIN_EMAIL` / `ADMIN_PASSWORD` ile giriş yapın. İlk yönetici yalnızca veritabanı
boşken oluşturulur. Şifresini sonradan `.env`'de değiştirmek mevcut kullanıcının şifresini değiştirmez.

## Ortam değişkenleri (`.env`)

| Değişken | Zorunlu | Açıklama |
| --- | --- | --- |
| `FRONTEND_URL` | evet | Kullanıcıların açtığı adres, ör. `https://survey.example.com`. Davet linkleri `{FRONTEND_URL}/survey/{id}?token=…` biçiminde kurulur |
| `DB_PASSWORD` | evet | PostgreSQL şifresi. İlk açılışta veritabanı bu şifreyle oluşturulur |
| `JWT_SECRET` | evet | En az 32 karakter, ör. `openssl rand -base64 48`. Değişirse açık oturumlar düşer |
| `ADMIN_PASSWORD` | evet | İlk yöneticinin şifresi |
| `ADMIN_EMAIL` | | Varsayılan `admin@teamdefinex.com` |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | evet | SMTP hesabı. Gmail'de hesap şifresi değil, uygulama şifresi kullanılır. Davet mailleri her zaman SMTP ile gönderilir |
| `MAIL_HOST`, `MAIL_PORT` | | Varsayılan `smtp.gmail.com`, `587` (STARTTLS) |
| `HTTP_PORT` | | Sunucuda dinlenen port, varsayılan `80` |
| `DB_NAME`, `DB_USERNAME` | | Varsayılan `dfx_survey_db`, `dfx_user` |
| `DDL_AUTO` | | Varsayılan `update`. **`create` kullanmayın**, her açılışta veriyi siler |
| `APP_VERSION` | | İmaj etiketi, varsayılan `latest` |

`.env` git'e eklenmez. Sunucuda dosya iznini kısıtlayın: `chmod 600 .env`.

## HTTPS

Container'lar düz HTTP konuşur. Davet linkleri token taşıdığı için üretimde mutlaka HTTPS kullanılmalı. TLS'i önde bir
reverse proxy sonlandırmalı (Caddy, Traefik, sunucudaki nginx veya bulut yük dengeleyici):

- **Port:** `HTTP_PORT`'u ör. `8081` yapın ve proxy'yi `http://127.0.0.1:8081`'e yönlendirin.
- **Adres:** `FRONTEND_URL`'i `https://…` adresi olarak verin.
- **İstemci IP'si:** Proxy `X-Forwarded-For` başlığını eklemeli. Backend, katılımcı uç noktalarındaki istek sınırını
  istemci IP'sine göre uygular.

## Güncelleme

```bash
git pull
docker compose up -d --build
```

Frontend ve backend imajları yeniden derlenir, veritabanı volume'ü korunur. Şema değişiklikleri `DDL_AUTO=update` ile
uygulanır. Bu yöntem kolon ekler ama kolon silmez veya yeniden adlandırmaz, bu tür değişiklikler elle yapılmalıdır.
Kalıcı çözüm Flyway migration'larıdır (TASKS.md, T-17).

## İşletim

```bash
docker compose logs -f backend                    # uygulama logları
docker compose exec db pg_dump -U dfx_user dfx_survey_db > yedek.sql   # yedek
docker compose exec -T db psql -U dfx_user dfx_survey_db < yedek.sql   # geri yükleme
docker compose down                               # durdur (veri korunur)
```

`docker compose down -v` volume'leri de siler, yani **tüm veri gider**.

## Bilinen sınırlar

- **Tek backend instance'ı:** İstek sınırı (rate limit) bellekte tutulur, backend'i birden fazla kopya çalıştırmaya
  uygun değildir.
- **Uzun gönderim:** Anket gönderimi davet maillerini istek içinde sırayla gönderir. Çok katılımcılı ankette istek
  uzun sürer (nginx zaman aşımı 300 sn). Kuyruğa alma: T-39.
- **Testler imajda çalışmaz:** İmaj derlenirken testler koşmaz. Testleri CI'da çalıştırın: `cd backend && ./gradlew test`.
  `DemoApplicationTests` çalışan bir PostgreSQL ister.
- **Saat dilimi:** Backend container'ı `Europe/Istanbul` saat diliminde çalışır. Tarihler saat dilimi bilgisi olmadan bu
  dilime göre saklanır.
