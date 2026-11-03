package com.example.demo.dao.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "survey_template")
public class SurveyTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "source_survey_id")
    private Long sourceSurveyId;

    private Boolean isAnonymous;

    private LocalDateTime createdDateTime;

    private LocalDateTime updatedDateTime;

    @OneToMany(
            mappedBy = "surveyTemplate",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @OrderBy("questionOrder ASC")
    private List<TemplateQuestion> questionList =
            new ArrayList<>();

    public void addQuestion(TemplateQuestion question) {
        questionList.add(question);
        question.setSurveyTemplate(this);
    }

    public void removeQuestion(TemplateQuestion question) {
        questionList.remove(question);
        question.setSurveyTemplate(null);
    }
}