package com.example.demo.dto;

import java.time.LocalDateTime;

/**
 * @param code İstemcinin hatayı ayırt etmesi gereken durumlarda makine-okunur kod
 *             (ör. INVITATION_INVALID, SURVEY_EXPIRED, ALREADY_ANSWERED, RATE_LIMITED); diğer hatalarda null.
 */
public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        String code
) {

    public ErrorResponse(LocalDateTime timestamp, int status, String error, String message, String path) {
        this(timestamp, status, error, message, path, null);
    }
}
