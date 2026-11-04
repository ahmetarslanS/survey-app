package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OptionReportResponse {

    private Long answerId;
    private Integer answerOrder;
    private String text;
    private Long selectedCount;
    // Percentage of the question's respondents who selected this option, e.g. 40.00
    // For MULTIPLE_CHOICE questions the total of the options can be more than 100.
    private BigDecimal selectedRate;
}
