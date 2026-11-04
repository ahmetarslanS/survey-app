package com.example.demo.dto;

import com.example.demo.dao.entity.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionReportResponse {

    private Long questionId;
    private String questionText;
    private Integer questionOrder;
    private QuestionType type;
    private Boolean isOptional;
    // Number of participants who answered this question.
    private Long answeredCount;
    // Percentage of the survey's respondents who answered this question, e.g. 80.00
    private BigDecimal answeredRate;
    // Average score between 1-5, only for LIKERT questions.
    private BigDecimal averageScore;
    // Options with selection counts, empty for FREETEXT questions.
    private List<OptionReportResponse> options = new ArrayList<>();
    // Given text answers, only for FREETEXT questions.
    private List<String> freeTextAnswers = new ArrayList<>();
}
