package com.example.demo.exception;

import java.time.Duration;
import java.time.LocalDateTime;

/** FR-01: Art arda hatalı denemeler sonrası hesap geçici olarak kilitlidir. */
public class AccountLockedException extends RuntimeException {

    public AccountLockedException(LocalDateTime lockedUntil) {
        super(buildMessage(lockedUntil));
    }

    private static String buildMessage(LocalDateTime lockedUntil) {
        long minutes = Math.max(1, (long) Math.ceil(Duration.between(LocalDateTime.now(), lockedUntil).toSeconds() / 60.0));
        return "Çok fazla hatalı giriş denemesi yapıldı. Hesabınız geçici olarak kilitlendi, "
                + minutes + " dakika sonra tekrar deneyin.";
    }
}
