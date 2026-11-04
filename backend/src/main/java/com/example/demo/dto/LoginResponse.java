package com.example.demo.dto;

import java.time.Instant;

/**
 * @param token     Authorization: Bearer {token} olarak gönderilecek JWT
 * @param tokenType Her zaman "Bearer"
 * @param expiresAt Token'ın geçerlilik sonu (UTC)
 * @param user      Giriş yapan kullanıcı
 */
public record LoginResponse(
        String token,
        String tokenType,
        Instant expiresAt,
        AuthUserResponse user
) {
}
