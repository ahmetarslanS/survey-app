package com.example.demo.dto;

import com.example.demo.dao.entity.Status;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminSurveyListResponse {

    private Long id;
    private String title;
    private String description;
    private Status status;
    private LocalDateTime endDate;
    private Long participantCount;
    private Long responseCount;
    // Percentage of participants who responded, e.g. 66.67
    private BigDecimal responseRate;
}
