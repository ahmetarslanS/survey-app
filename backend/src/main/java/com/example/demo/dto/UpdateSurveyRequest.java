package com.example.demo.dto;

import com.example.demo.dao.entity.Status;

import java.time.LocalDateTime;

/**
 * UpdateSurveyRequest
 * Both fields are optional, only the given fields are updated.
 * @param status
 * @param endDate
 */
public record UpdateSurveyRequest(

        Status status,
        LocalDateTime endDate

) {
}
