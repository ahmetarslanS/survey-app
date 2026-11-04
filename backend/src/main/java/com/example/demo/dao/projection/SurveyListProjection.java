package com.example.demo.dao.projection;

import com.example.demo.dao.entity.Status;

import java.time.LocalDateTime;

public interface SurveyListProjection {

    Long getId();
    String getTitle();
    String getDescription();
    Status getStatus();
    LocalDateTime getEndDate();
    Long getParticipantCount();
    Long getResponseCount();
}
