package com.example.demo.dao.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UserStatus {
    ACTIVE("ACTIVE", "Aktif"),
    PASSIVE("PASSIVE", "Pasif");

    private final String code;
    private final String description;
}
