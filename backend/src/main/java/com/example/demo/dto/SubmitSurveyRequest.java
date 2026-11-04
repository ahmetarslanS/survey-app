package com.example.demo.dto;

import java.util.List;

/**
 * POST /user/surveys/{surveyId}/responses
 * <pre>
 * { "answers": [
 *     { "questionId": 1, "optionIds": [3] },        // LIKERT / SINGLE_CHOICE: tek seçenek
 *     { "questionId": 2, "optionIds": [5, 6] },     // MULTIPLE_CHOICE: bir veya daha fazla seçenek
 *     { "questionId": 3, "text": "..." }            // FREETEXT
 * ] }
 * </pre>
 * Yanıtlanmayan opsiyonel sorular gönderilmeyebilir.
 */
public record SubmitSurveyRequest(List<Answer> answers) {

    public record Answer(
            Long questionId,
            List<Long> optionIds,
            String text
    ) {
    }
}
