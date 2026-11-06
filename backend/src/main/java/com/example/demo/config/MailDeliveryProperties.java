package com.example.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * application.properties -> app.mail.*
 *
 * @param maxAttempts Başarısız gönderimde toplam deneme sayısı (NFR-42: 3).
 */
@ConfigurationProperties(prefix = "app.mail")
public record MailDeliveryProperties(
        @DefaultValue("3") int maxAttempts
) {
}
