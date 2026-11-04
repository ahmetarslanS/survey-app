package com.example.demo.dto;

import java.time.LocalDateTime;
import java.util.List;

public record SurveyTemplateDetailResponse(
        Long id,
        String name,
        String description,
        Long sourceSurveyId,
        Boolean isAnonymous,
        LocalDateTime createdDateTime,
        LocalDateTime updatedDateTime,
        List<TemplateQuestionResponse> questionList
) {
}