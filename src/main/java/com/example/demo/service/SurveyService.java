package com.example.demo.service;

import com.example.demo.dao.entity.Status;
import com.example.demo.dao.entity.Survey;
import com.example.demo.dao.repository.SurveyRepository;
import com.example.demo.dto.CreateSurveyRequest;
import com.example.demo.dto.SurveyStatusResponse;
import com.example.demo.dto.UpdateSurveyStatusRequest;
import com.example.demo.exception.InvalidSurveyStatusTransitionException;
import com.example.demo.exception.SurveyNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

public interface SurveyService {

    Survey createSurvey(CreateSurveyRequest request);
    SurveyStatusResponse updateStatus(Long surveyId, UpdateSurveyStatusRequest request);
}