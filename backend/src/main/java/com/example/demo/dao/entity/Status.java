package com.example.demo.dao.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Status {
    LIVE("LIVE", "Yayında"),
    DRAFT("DRAFT", "Taslak"),
    CLOSED("CLOSED", "Kapandı"),
    OUTDATED("OUTDATED", "Süresi Doldu");

    private final String code;
    private final String description;
}
