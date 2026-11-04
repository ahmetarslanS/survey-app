package com.example.demo.service;

import com.example.demo.dto.ParticipantSurveyResponse;
import com.example.demo.dto.SubmitSurveyRequest;

/** Katılımcı (hesapsız, davet tokenı ile) anket işlemleri. */
public interface ParticipantSurveyService {

    /** Token ile anketi getirir; ilk açılışta davet "Başlandı" olur (FR-60, FR-65). */
    ParticipantSurveyResponse getSurvey(Long surveyId, String token);

    /** Ara kayıt (FR-63). draftJson istemcinin yanıt taslağıdır (JSON nesnesi). */
    void saveDraft(Long surveyId, String token, String draftJson);

    /** Nihai gönderim; token burada tüketilir (FR-64, BR-01, BR-02, BR-06). */
    void submit(Long surveyId, String token, SubmitSurveyRequest request);
}
