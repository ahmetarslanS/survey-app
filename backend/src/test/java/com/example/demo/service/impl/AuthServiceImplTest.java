package com.example.demo.service.impl;

import com.example.demo.dao.entity.User;
import com.example.demo.dao.entity.UserStatus;
import com.example.demo.dao.repository.UserRepository;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.exception.AccountLockedException;
import com.example.demo.exception.InvalidCredentialsException;
import com.example.demo.security.AuthProperties;
import com.example.demo.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.*;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceImplTest {

    private static final Instant NOW = Instant.parse("2026-11-04T10:00:00Z");
    private static final String EMAIL = "admin@teamdefinex.com";
    private static final String PASSWORD = "unit-test-password";

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final JwtService jwtService = mock(JwtService.class);
    private final Clock clock = Clock.fixed(NOW, ZoneId.of("Europe/Istanbul"));
    private final AuthProperties properties = new AuthProperties(
            "test-secret-that-is-at-least-32-bytes-long", "survey-tool",
            Duration.ofMinutes(30), 5, Duration.ofMinutes(15), null);

    private AuthServiceImpl authService;
    private User user;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(userRepository, passwordEncoder, jwtService, properties, clock);
        user = new User();
        user.setId(1L);
        user.setFullName("Survey Admin");
        user.setEmail(EMAIL);
        user.setPasswordHash(passwordEncoder.encode(PASSWORD));
        when(userRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(user));
        when(jwtService.issue(any())).thenReturn(new JwtService.IssuedToken("jwt", NOW.plusSeconds(1800)));
    }

    @Test
    void successfulLoginReturnsTokenAndResetsCounter() {
        user.setFailedLoginAttempts(3);

        LoginResponse response = authService.login(new LoginRequest(EMAIL, PASSWORD));

        assertThat(response.token()).isEqualTo("jwt");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.user().email()).isEqualTo(EMAIL);
        assertThat(user.getFailedLoginAttempts()).isZero();
        assertThat(user.getLastLoginDateTime()).isEqualTo(LocalDateTime.now(clock));
    }

    @Test
    void wrongPasswordIncrementsCounterWithGenericMessage() {
        assertThatThrownBy(() -> authService.login(new LoginRequest(EMAIL, "wrong")))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("E-posta veya şifre hatalı.");
        assertThat(user.getFailedLoginAttempts()).isEqualTo(1);
    }

    @Test
    void unknownEmailGivesSameGenericMessage() {
        when(userRepository.findByEmailIgnoreCase("nobody@x.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("nobody@x.com", PASSWORD)))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("E-posta veya şifre hatalı.");
    }

    @Test
    void fifthWrongAttemptLocksAccountFor15Minutes() {
        for (int i = 0; i < 4; i++) {
            assertThatThrownBy(() -> authService.login(new LoginRequest(EMAIL, "wrong")))
                    .isInstanceOf(InvalidCredentialsException.class);
        }

        assertThatThrownBy(() -> authService.login(new LoginRequest(EMAIL, "wrong")))
                .isInstanceOf(AccountLockedException.class);
        assertThat(user.getLockedUntil()).isEqualTo(LocalDateTime.now(clock).plusMinutes(15));
    }

    @Test
    void lockedAccountRejectsEvenCorrectPassword() {
        user.setLockedUntil(LocalDateTime.now(clock).plusMinutes(10));

        assertThatThrownBy(() -> authService.login(new LoginRequest(EMAIL, PASSWORD)))
                .isInstanceOf(AccountLockedException.class);
        verify(jwtService, never()).issue(any());
    }

    @Test
    void expiredLockAllowsLogin() {
        user.setLockedUntil(LocalDateTime.now(clock).minusMinutes(1));

        assertThat(authService.login(new LoginRequest(EMAIL, PASSWORD)).token()).isEqualTo("jwt");
        assertThat(user.getLockedUntil()).isNull();
    }

    @Test
    void passiveUserCannotLogin() {
        user.setStatus(UserStatus.PASSIVE);

        assertThatThrownBy(() -> authService.login(new LoginRequest(EMAIL, PASSWORD)))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void blankCredentialsAreRejected() {
        assertThatThrownBy(() -> authService.login(new LoginRequest(" ", "")))
                .isInstanceOf(InvalidCredentialsException.class);
    }
}
