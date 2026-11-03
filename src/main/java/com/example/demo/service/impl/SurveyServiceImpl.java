package com.example.demo.service.impl;

import com.example.demo.dao.entity.Survey;
import com.example.demo.dto.CreateSurveyRequest;
import com.example.demo.service.SurveyService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;


@Slf4j
@Service
@RequiredArgsConstructor
public class SurveyServiceImpl implements SurveyService {

    @Override
    @Transactional
    public Survey createSurvey(CreateSurveyRequest request) {
        Survey surveyEntity = new Survey();
        return surveyEntity;
    }
}
