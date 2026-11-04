package com.example.demo.dao.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Role {
    ADMIN("ADMIN", "Admin"),
    SYSTEM_ADMIN("SYSTEM_ADMIN", "Sistem Yöneticisi");

    private final String code;
    private final String description;
}
