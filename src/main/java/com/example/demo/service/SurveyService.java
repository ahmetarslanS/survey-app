package com.example.demo.service;

import com.example.demo.dao.entity.Survey;
import com.example.demo.dto.CreateSurveyRequest;

public interface SurveyService {
    Survey createSurvey(CreateSurveyRequest request);
}
