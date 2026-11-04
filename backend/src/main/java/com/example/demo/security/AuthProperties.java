package com.example.demo.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * application.properties -> app.auth.*
 *
 * @param jwtSecret         HS256 imza anahtarı, en az 32 byte (256 bit). Üretimde JWT_SECRET ortam değişkeninden verilmeli.
 * @param jwtIssuer         Token'daki "iss" değeri; doğrulamada kontrol edilir.
 * @param tokenTtl          Erişim token'ı ömrü (FR-02: 30 dk hareketsizlik).
 * @param maxFailedAttempts Hesap kilitlenmeden önceki hatalı deneme sayısı (FR-01: 5).
 * @param lockDuration      Kilit süresi (FR-01: 15 dk).
 * @param initialAdmin      Hiç kullanıcı yokken açılışta oluşturulacak ilk admin (Q-01: serbest kayıt yok).
 */
@ConfigurationProperties(prefix = "app.auth")
public record AuthProperties(
        String jwtSecret,
        @DefaultValue("survey-tool") String jwtIssuer,
        @DefaultValue("30m") Duration tokenTtl,
        @DefaultValue("5") int maxFailedAttempts,
        @DefaultValue("15m") Duration lockDuration,
        @DefaultValue InitialAdmin initialAdmin
) {

    public AuthProperties {
        if (jwtSecret == null || jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("app.auth.jwt-secret en az 32 byte (256 bit) olmalıdır.");
        }
    }

    public record InitialAdmin(String email, String password, @DefaultValue("Survey Admin") String fullName) {
    }
}
