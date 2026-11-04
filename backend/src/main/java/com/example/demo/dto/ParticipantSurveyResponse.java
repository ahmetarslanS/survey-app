package com.example.demo.dto;

import com.example.demo.dao.entity.QuestionType;
import com.fasterxml.jackson.annotation.JsonRawValue;

import java.time.LocalDateTime;
import java.util.List;

/**
 * GET /user/surveys/{surveyId} — katılımcının gördüğü anket.
 *
 * @param draftAnswers Ara kayıtta saklanan yanıt taslağı (istemcinin gönderdiği JSON nesnesi, olduğu gibi döner) ya da null.
 */
public record ParticipantSurveyResponse(
        Long surveyId,
        String title,
        String description,
        LocalDateTime endDate,
        boolean isAnonymous,
        List<Question> questions,
        @JsonRawValue String draftAnswers
) {

    public record Question(
            Long questionId,
            String questionText,
            QuestionType type,
            Integer questionOrder,
            boolean isMandatory,
            List<Option> options
    ) {
    }

    public record Option(
            Long answerId,
            Integer answerOrder,
            String text
    ) {
    }
}
