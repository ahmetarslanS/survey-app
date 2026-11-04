package com.example.demo.service;

import com.example.demo.dao.entity.Status;
import com.example.demo.dao.entity.Survey;
import com.example.demo.dto.AdminSurveyListResponse;
import com.example.demo.dao.repository.SurveyRepository;
import com.example.demo.dto.CreateSurveyRequest;
import com.example.demo.dto.SurveyReportResponse;
import com.example.demo.dto.SurveyUpdateResponse;
import com.example.demo.dto.UpdateSurveyRequest;
import com.example.demo.exception.InvalidSurveyStatusTransitionException;
import com.example.demo.exception.SurveyNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

import java.util.List;

public interface SurveyService {
    Survey createSurvey(CreateSurveyRequest request);

    Survey createSurvey(CreateSurveyRequest request, MultipartFile participantFile);

    List<AdminSurveyListResponse> getAllSurveys();
    SurveyUpdateResponse updateSurvey(Long surveyId, UpdateSurveyRequest request);

    SurveyReportResponse getSurveyReport(Long surveyId);

    byte[] exportSurveyReportAsCsv(Long surveyId);
}
