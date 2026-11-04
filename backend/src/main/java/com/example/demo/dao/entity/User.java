package com.example.demo.dao.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Admin paneline giriş yapan kullanıcı. Katılımcılar hesap açmaz; onlar davet tokenı ile erişir.
 * "user" PostgreSQL'de ayrılmış kelime olduğu için tablo adı app_user.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "app_user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.ADMIN;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(nullable = false)
    private int failedLoginAttempts = 0;

    private LocalDateTime lockedUntil;

    private LocalDateTime lastLoginDateTime;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDateTime;

    @PrePersist
    void onCreate() {
        if (createdDateTime == null) {
            createdDateTime = LocalDateTime.now();
        }
    }

    public boolean isLocked(LocalDateTime now) {
        return lockedUntil != null && lockedUntil.isAfter(now);
    }

    public boolean isActive() {
        return status == UserStatus.ACTIVE;
    }
}
