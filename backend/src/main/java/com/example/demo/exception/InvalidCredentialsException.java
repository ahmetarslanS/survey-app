package com.example.demo.exception;

/**
 * FR-01: Hatalı girişte nedenini açık etmeyen genel mesaj (kullanıcı yok / şifre yanlış / hesap pasif ayırt edilmez).
 */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("E-posta veya şifre hatalı.");
    }
}
