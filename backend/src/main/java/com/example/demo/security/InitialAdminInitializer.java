package com.example.demo.security;

import com.example.demo.dao.entity.Role;
import com.example.demo.dao.entity.User;
import com.example.demo.dao.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Serbest kayıt olmadığı için (Q-01) sistemde hiç kullanıcı yokken app.auth.initial-admin.* ile ilk admin hesabını açar.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class InitialAdminInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthProperties properties;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        AuthProperties.InitialAdmin admin = properties.initialAdmin();
        if (userRepository.count() > 0) {
            return;
        }
        if (admin == null || !StringUtils.hasText(admin.email()) || !StringUtils.hasText(admin.password())) {
            log.warn("Sistemde kullanıcı yok ve app.auth.initial-admin tanımlı değil; admin girişi yapılamayacak.");
            return;
        }

        User user = new User();
        user.setFullName(admin.fullName());
        user.setEmail(admin.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(admin.password()));
        user.setRole(Role.ADMIN);
        userRepository.save(user);
        // NFR-43: kişisel veri (e-posta) loglanmaz
        log.info("İlk admin kullanıcısı oluşturuldu (id={}).", user.getId());
    }
}
