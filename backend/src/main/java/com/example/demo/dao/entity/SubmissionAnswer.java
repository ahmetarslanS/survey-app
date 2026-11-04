package com.example.demo.dao.entity;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "submission_answer")
public class SubmissionAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private SurveySubmission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Question question;

    // Selected option for LIKERT, SINGLE_CHOICE and MULTIPLE_CHOICE questions, null for FREETEXT.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Answer answer;

    // Participant's input for FREETEXT questions, null for the other types.
    @Column(length = 2000)
    private String text;
}
