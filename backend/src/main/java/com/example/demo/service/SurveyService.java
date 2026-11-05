package com.example.demo.service;

import com.example.demo.dao.entity.Survey;
import com.example.demo.dto.AdminSurveyListResponse;
import com.example.demo.dto.CreateSurveyRequest;
import com.example.demo.dto.SendSurveyResponse;
import com.example.demo.dto.SurveyDetailResponse;
import com.example.demo.dto.SurveyReportResponse;
import com.example.demo.dto.SurveyUpdateResponse;
import com.example.demo.dto.UpdateSurveyRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface SurveyService {

    /** Anketi doğrudan LIVE oluşturup davetleri gönderir (taslak adımı olmadan). */
    Survey createSurvey(CreateSurveyRequest request);

    Survey createSurvey(CreateSurveyRequest request, MultipartFile participantFile);

    /** Anketi DRAFT olarak kaydeder; mail gönderilmez. */
    Long createDraft(CreateSurveyRequest request);

    /** Taslağın içeriğini (sorular ve katılımcılar dahil) baştan yazar. Yalnızca DRAFT. */
    Long updateDraft(Long surveyId, CreateSurveyRequest request);

    SurveyDetailResponse getSurvey(Long surveyId);

    /** Taslağı yayına alır ve davetleri gönderir. Yalnızca DRAFT. */
    SendSurveyResponse sendSurvey(Long surveyId);

    /** Yalnızca DRAFT anketler silinebilir (BR-08). */
    void deleteDraft(Long surveyId);

    List<AdminSurveyListResponse> getAllSurveys();

    SurveyUpdateResponse updateSurvey(Long surveyId, UpdateSurveyRequest request);

    SurveyReportResponse getSurveyReport(Long surveyId);

    byte[] exportSurveyReportAsCsv(Long surveyId);
}
