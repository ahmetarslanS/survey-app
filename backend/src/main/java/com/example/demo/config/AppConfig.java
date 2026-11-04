package com.example.demo.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({InvitationProperties.class, MailDeliveryProperties.class})
public class AppConfig {
}
