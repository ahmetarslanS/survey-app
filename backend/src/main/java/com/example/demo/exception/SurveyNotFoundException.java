package com.example.demo.exception;

public class SurveyNotFoundException extends RuntimeException {

    public SurveyNotFoundException(Long surveyId) {
        super("Anket bulunamadı. Survey id: " + surveyId);
    }
}