package com.example.demo.dto;

import com.example.demo.dao.entity.Status;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SurveyReportResponse {

    private Long surveyId;
    private String title;
    private String description;
    private Status status;
    private String statusDescription;
    private LocalDateTime endDate;
    private Boolean isAnonymous;

    // Number of invited participants.
    private Long participantCount;
    // Number of participants who submitted the survey.
    private Long responseCount;
    // responseCount / participantCount * 100, e.g. 66.67
    private BigDecimal participationRate;

    // Average completion time, null if no completion time could be calculated.
    private Long averageCompletionTimeSeconds;
    // Readable form of the average completion time, e.g. "4 dk 30 sn"
    private String averageCompletionTimeText;

    // Average score of all LIKERT answers between 1-5, null if there is no LIKERT answer.
    private BigDecimal satisfactionAverage;

    private List<QuestionReportResponse> questionReports = new ArrayList<>();
}
