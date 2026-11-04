package com.example.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * application.properties -> app.invitation.*
 *
 * @param baseUrl            Katılımcı formunun bulunduğu frontend adresi; davet linki buradan üretilir.
 * @param rateLimitPerMinute /user/** uç noktalarına IP başına dakikalık istek sınırı (NFR-03).
 */
@ConfigurationProperties(prefix = "app.invitation")
public record InvitationProperties(
        @DefaultValue("http://localhost:5173") String baseUrl,
        @DefaultValue("120") int rateLimitPerMinute
) {

    /** {baseUrl}/survey/{surveyId}?token={token} — token URL-safe Base64 olduğu için ayrıca kodlanmaz. */
    public String buildSurveyLink(Long surveyId, String token) {
        String base = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        return base + "/survey/" + surveyId + "?token=" + token;
    }
}
