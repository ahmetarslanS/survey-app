package com.example.demo.dto;

import java.time.LocalDateTime;

public record CreateSurveyFromTemplateRequest(
        String title,
        String description,
        LocalDateTime endDate,
        Boolean isAnonymous
) {
}