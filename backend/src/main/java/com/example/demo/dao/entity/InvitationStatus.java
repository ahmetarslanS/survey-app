package com.example.demo.dao.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Davet yaşam döngüsü (analiz §3.3). "Süresi Doldu" saklanmaz; anketin bitiş tarihinden türetilir,
 * böylece tarih uzatılınca yanıtlamamış katılımcıların linkleri kendiliğinden yeniden çalışır (AS-04).
 */
@Getter
@RequiredArgsConstructor
public enum InvitationStatus {
    CREATED("CREATED", "Oluşturuldu"),
    SENT("SENT", "Gönderildi"),
    STARTED("STARTED", "Başlandı"),
    COMPLETED("COMPLETED", "Tamamlandı"),
    CANCELLED("CANCELLED", "İptal"),
    FAILED("FAILED", "Hata");

    private final String code;
    private final String description;
}
