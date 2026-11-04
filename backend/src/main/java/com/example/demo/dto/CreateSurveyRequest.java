package com.example.demo.dto;

import com.example.demo.dao.entity.Question;
import com.example.demo.dao.entity.Status;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateSurveyRequest {

    private String title;
    private String description;
    private List<Question> questionList;
    private LocalDateTime endDate;
    private List<String> participantMails;
    private Boolean isAnonymous;
}
