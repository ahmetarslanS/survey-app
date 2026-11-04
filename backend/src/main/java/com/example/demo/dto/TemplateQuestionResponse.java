package com.example.demo.dto;

import com.example.demo.dao.entity.QuestionType;

import java.util.List;

public record TemplateQuestionResponse(
        Long id,
        String questionText,
        Integer questionOrder,
        QuestionType type,
        Boolean isOptional,
        List<TemplateAnswerResponse> answerList
) {
}