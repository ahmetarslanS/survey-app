package com.example.demo.service.impl;

import com.example.demo.dao.entity.User;
import com.example.demo.dao.repository.UserRepository;
import com.example.demo.dto.AuthUserResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.exception.AccountLockedException;
import com.example.demo.exception.InvalidCredentialsException;
import com.example.demo.security.AuthProperties;
import com.example.demo.security.JwtService;
import com.example.demo.service.AuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Clock;
import java.time.LocalDateTime;

@Slf4j
@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthProperties properties;
    private final Clock clock;

    /** Kullanıcı bulunamadığında da bcrypt karşılaştırması yapılarak yanıt süresi eşitlenir (kullanıcı tahmini zorlaşır). */
    private final String dummyHash;

    @Autowired
    public AuthServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtService jwtService,
                           AuthProperties properties) {
        this(userRepository, passwordEncoder, jwtService, properties, Clock.systemDefaultZone());
    }

    AuthServiceImpl(UserRepository userRepository,
                    PasswordEncoder passwordEncoder,
                    JwtService jwtService,
                    AuthProperties properties,
                    Clock clock) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.properties = properties;
        this.clock = clock;
        this.dummyHash = passwordEncoder.encode("timing-equalizer");
    }

    @Override
    // Hatalı deneme sayacı ve kilit bilgisi exception fırlatılsa da kaydedilmeli
    @Transactional(noRollbackFor = {InvalidCredentialsException.class, AccountLockedException.class})
    public LoginResponse login(LoginRequest request) {
        if (request == null || !StringUtils.hasText(request.email()) || !StringUtils.hasText(request.password())) {
            throw new InvalidCredentialsException();
        }

        User user = userRepository.findByEmailIgnoreCase(request.email().trim()).orElse(null);
        if (user == null) {
            passwordEncoder.matches(request.password(), dummyHash);
            throw new InvalidCredentialsException();
        }

        LocalDateTime now = LocalDateTime.now(clock);
        if (user.isLocked(now)) {
            throw new AccountLockedException(user.getLockedUntil());
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            registerFailedAttempt(user, now);
        }

        if (!user.isActive()) {
            throw new InvalidCredentialsException();
        }

        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginDateTime(now);
        log.info("Admin girişi başarılı (userId={}).", user.getId());
        return buildResponse(user);
    }

    private void registerFailedAttempt(User user, LocalDateTime now) {
        int attempts = user.getFailedLoginAttempts() + 1;
        if (attempts >= properties.maxFailedAttempts()) {
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(now.plus(properties.lockDuration()));
            log.warn("Hesap {} hatalı deneme sonrası kilitlendi (userId={}).", attempts, user.getId());
            throw new AccountLockedException(user.getLockedUntil());
        }
        user.setFailedLoginAttempts(attempts);
        throw new InvalidCredentialsException();
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResponse refresh(Long userId) {
        User user = findUsableUser(userId);
        return buildResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthUserResponse getCurrentUser(Long userId) {
        return AuthUserResponse.from(findUsableUser(userId));
    }

    /** Token geçerli olsa bile kullanıcı sonradan pasife alınmış veya kilitlenmiş olabilir. */
    private User findUsableUser(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(InvalidCredentialsException::new);
        if (!user.isActive() || user.isLocked(LocalDateTime.now(clock))) {
            throw new InvalidCredentialsException();
        }
        return user;
    }

    private LoginResponse buildResponse(User user) {
        JwtService.IssuedToken token = jwtService.issue(user);
        return new LoginResponse(token.value(), "Bearer", token.expiresAt(), AuthUserResponse.from(user));
    }
}
