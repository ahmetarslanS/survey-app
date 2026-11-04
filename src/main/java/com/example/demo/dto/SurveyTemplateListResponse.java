package com.example.demo.dto;

import java.time.LocalDateTime;

public record SurveyTemplateListResponse(
        Long id,
        String name,
        String description,
        Long sourceSurveyId,
        Integer questionCount,
        LocalDateTime createdDateTime
) {
}