package com.example.demo.dao.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "template_question")
public class TemplateQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "survey_template_id",
            nullable = false
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private SurveyTemplate surveyTemplate;

    @Column(nullable = false)
    private String questionText;

    @Column(nullable = false)
    private Integer questionOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private QuestionType type;

    private Boolean isOptional;

    @OneToMany(
            mappedBy = "templateQuestion",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @OrderBy("answerOrder ASC")
    private List<TemplateAnswer> answerList =
            new ArrayList<>();

    public void addAnswer(TemplateAnswer answer) {
        answerList.add(answer);
        answer.setTemplateQuestion(this);
    }

    public void removeAnswer(TemplateAnswer answer) {
        answerList.remove(answer);
        answer.setTemplateQuestion(null);
    }
}