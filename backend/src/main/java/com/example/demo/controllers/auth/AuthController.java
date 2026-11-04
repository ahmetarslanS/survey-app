package com.example.demo.controllers.auth;

import com.example.demo.dto.AuthUserResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /** Herkese açık. Başarılı girişte JWT döner. */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /** Geçerli token ile yeni token alır; kullanıcı aktifken oturumun düşmemesi için kullanılır (FR-02). */
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(authService.refresh(Long.valueOf(jwt.getSubject())));
    }

    /** Token sahibinin bilgileri. */
    @GetMapping("/me")
    public ResponseEntity<AuthUserResponse> me(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(authService.getCurrentUser(Long.valueOf(jwt.getSubject())));
    }
}
