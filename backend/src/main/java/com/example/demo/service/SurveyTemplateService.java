package com.example.demo.service;

import com.example.demo.dto.CreateSurveyFromTemplateRequest;
import com.example.demo.dto.CreateTemplateRequest;
import com.example.demo.dto.SurveyTemplateDetailResponse;
import com.example.demo.dto.SurveyTemplateListResponse;

import java.util.List;

public interface SurveyTemplateService {

    SurveyTemplateDetailResponse createTemplate(
            Long surveyId,
            CreateTemplateRequest request
    );

    List<SurveyTemplateListResponse> getAllTemplates();

    SurveyTemplateDetailResponse getTemplate(
            Long templateId
    );

    Long createSurveyFromTemplate(
            Long templateId,
            CreateSurveyFromTemplateRequest request
    );

    void deleteTemplate(Long templateId);
}