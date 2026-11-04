package com.example.demo.exception;

/** NFR-03: Katılımcı uç noktalarına kısa sürede çok fazla istek. */
public class RateLimitExceededException extends RuntimeException {

    public RateLimitExceededException() {
        super("Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.");
    }
}
