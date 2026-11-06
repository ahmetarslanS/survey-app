# syntax=docker/dockerfile:1

# ---- Derleme ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

# Önce yalnızca Gradle dosyaları: bağımlılık katmanı kaynak kod değişmedikçe önbellekten gelir
COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
# Windows'ta CRLF ile checkout edilmiş olabilir
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew && ./gradlew --no-daemon -q dependencies > /dev/null

COPY src src
# Testler imajda çalıştırılmaz: DemoApplicationTests gerçek bir PostgreSQL ister. Testleri CI'da `./gradlew test` ile koşun.
RUN ./gradlew --no-daemon bootJar -x test \
 && find build/libs -name '*.jar' ! -name '*-plain.jar' -exec cp {} app.jar \;

# ---- Çalışma ----
FROM eclipse-temurin:21-jre
WORKDIR /app

RUN groupadd --system app && useradd --system --gid app --home-dir /app app \
 && chown -R app:app /app

COPY --from=build --chown=app:app /workspace/app.jar /app/app.jar

# Uygulama LocalDateTime.now() kullanır ve tarihleri Europe/Istanbul varsayar; container UTC'de kalırsa
# bitiş tarihi kontrolleri 3 saat kayar.
ENV TZ=Europe/Istanbul \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -Duser.timezone=Europe/Istanbul"

USER app
EXPOSE 8080

# Ek paket gerektirmeyen sağlık kontrolü (bash /dev/tcp)
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD bash -c 'exec 3<>/dev/tcp/127.0.0.1/8080 && printf "GET /actuator/health HTTP/1.0\r\nHost: localhost\r\n\r\n" >&3 && grep -q "\"UP\"" <&3'

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
