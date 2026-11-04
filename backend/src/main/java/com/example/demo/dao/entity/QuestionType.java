package com.example.demo.dao.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum QuestionType {

        LIKERT("LIKERT", "Likert"),
        MULTIPLE_CHOICE("MULTIPLE_CHOICE", "Çoklu Seçim"),
        SINGLE_CHOICE("SINGLE_CHOICE", "Tekli Seçim"),
        FREETEXT("FREETEXT", "Serbest Metin");

        private final String code;
        private final String description;
}
