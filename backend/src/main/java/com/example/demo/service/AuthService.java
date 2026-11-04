package com.example.demo.service;

import com.example.demo.dto.AuthUserResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;

public interface AuthService {

    /** E-posta + şifre ile giriş; başarılıysa JWT döner. */
    LoginResponse login(LoginRequest request);

    /** Geçerli token sahibine yeni bir token verir (oturum aktifken süreyi uzatmak için). */
    LoginResponse refresh(Long userId);

    AuthUserResponse getCurrentUser(Long userId);
}
