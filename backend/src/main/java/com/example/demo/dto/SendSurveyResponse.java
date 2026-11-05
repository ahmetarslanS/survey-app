package com.example.demo.dto;

import com.example.demo.dao.entity.Status;

import java.time.LocalDateTime;

/**
 * POST /admin/surveys/{surveyId}/send — gönderim özeti (FR-42).
 *
 * @param sentCount   Daveti başarıyla iletilen katılımcı sayısı
 * @param failedCount Mail gönderimi başarısız olan katılımcı sayısı (davet durumu FAILED)
 */
public record SendSurveyResponse(
        Long surveyId,
        Status status,
        LocalDateTime endDate,
        int participantCount,
        int sentCount,
        int failedCount
) {
}
