package com.example.demo.dto;

import com.example.demo.dao.entity.QuestionType;
import com.example.demo.dao.entity.Status;

import java.time.LocalDateTime;
import java.util.List;

/** GET /admin/surveys/{surveyId} — anketin tam içeriği (taslağı builder'da açmak için). */
public record SurveyDetailResponse(
        Long id,
        String title,
        String description,
        Status status,
        String statusDescription,
        LocalDateTime endDate,
        Boolean isAnonymous,
        List<String> participantMails,
        List<Question> questions,
        LocalDateTime createdDateTime,
        LocalDateTime updatedDateTime
) {

    public record Question(
            Long id,
            String questionText,
            QuestionType type,
            Integer questionOrder,
            boolean isOptional,
            String sectionTitle,
            List<Option> options
    ) {
    }

    public record Option(
            Long id,
            Integer answerOrder,
            String text
    ) {
    }
}
