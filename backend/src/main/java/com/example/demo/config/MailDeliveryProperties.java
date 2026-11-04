package com.example.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * application.properties -> app.mail.*
 *
 * @param enabled     false ise mailler SMTP ile gönderilmez, outboxDir klasörüne .html dosyası olarak yazılır
 *                    (geliştirmede gerçek adreslere mail gitmemesi için).
 * @param outboxDir   enabled=false iken maillerin yazılacağı klasör.
 * @param maxAttempts Başarısız gönderimde toplam deneme sayısı (NFR-42: 3).
 */
@ConfigurationProperties(prefix = "app.mail")
public record MailDeliveryProperties(
        @DefaultValue("true") boolean enabled,
        @DefaultValue("build/mail-outbox") String outboxDir,
        @DefaultValue("3") int maxAttempts
) {
}
