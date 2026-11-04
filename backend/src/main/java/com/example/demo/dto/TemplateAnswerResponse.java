package com.example.demo.dto;

public record TemplateAnswerResponse(
        Long id,
        Integer answerOrder,
        String text
) {
}