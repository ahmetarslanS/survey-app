package com.example.demo.dto;

import com.example.demo.dao.entity.Status;

/**
 * UpdateSurveyStatusRequest
 * @param status
 */
public record UpdateSurveyStatusRequest(

        Status status

) {
}