package com.example.demo.dto;

import com.example.demo.dao.entity.Status;

import java.time.LocalDateTime;

public record SurveyStatusResponse(
        Long surveyId,
        Status status,
        String statusDescription,
        LocalDateTime updatedDateTime
) {
}