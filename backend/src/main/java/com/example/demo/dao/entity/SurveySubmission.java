package com.example.demo.dao.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "survey_submission",
        uniqueConstraints = @UniqueConstraint(columnNames = {"participant_id"}))
public class SurveySubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Survey survey;

    // A participant can submit a survey only once.
    @ManyToOne(fetch = FetchType.LAZY)
    // BR-06: Anonim ankette yanıt kaydı katılımcıya bağlanmaz (null). Tekrar gönderim, katılımcının
    // COMPLETED durumu ile engellenir; kayıtlı modda bu unique kısıt da ikinci bir güvencedir.
    @JoinColumn(name = "participant_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private SurveyParticipant participant;

    private LocalDateTime submittedDateTime;

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SubmissionAnswer> submissionAnswerList = new ArrayList<>();
}
