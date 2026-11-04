package com.example.demo.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * Katılımcı davet linki kullanılamıyor (FR-65). Frontend `code` alanına göre ilgili bilgilendirme sayfasını gösterir.
 */
@Getter
public class InvitationAccessException extends RuntimeException {

    private final Reason reason;

    public InvitationAccessException(Reason reason) {
        super(reason.getMessage());
        this.reason = reason;
    }

    @Getter
    @RequiredArgsConstructor
    public enum Reason {
        /** Token yok, eşleşmiyor, başka ankete ait veya davet iptal edilmiş. Hangisi olduğu açık edilmez. */
        INVALID(HttpStatus.NOT_FOUND, "INVITATION_INVALID", "Bu bağlantı geçersiz veya iptal edilmiş."),
        /** Anketin bitiş tarihi geçmiş ya da anket kapatılmış (BR-03). */
        EXPIRED(HttpStatus.GONE, "SURVEY_EXPIRED", "Bu anketin süresi dolmuştur."),
        /** Token nihai gönderimde tüketilmiş (BR-01, AS-01). */
        ANSWERED(HttpStatus.CONFLICT, "ALREADY_ANSWERED", "Bu anketi zaten yanıtladınız.");

        private final HttpStatus status;
        private final String code;
        private final String message;
    }
}
