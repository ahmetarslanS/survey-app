package com.example.demo.dao.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "survey_participant",
        uniqueConstraints = @UniqueConstraint(columnNames = {"survey_id", "email"}))
public class SurveyParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Survey survey;

    private String email;
    private Boolean isResponded;
    // Set when the participant opens the survey, used to calculate the completion time.
    private LocalDateTime startedDateTime;
    private LocalDateTime respondedDateTime;

    // Davet tokenının SHA-256 özeti (NFR-02). Ham token yalnızca davet mailinde bulunur, hiçbir yerde saklanmaz.
    @Column(length = 64, unique = true)
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    private InvitationStatus invitationStatus = InvitationStatus.CREATED;

    private LocalDateTime sentDateTime;

    private LocalDateTime lastAccessDateTime;

    // Ara kayıt (FR-63): istemcinin gönderdiği yanıt taslağı (JSON nesnesi). Nihai gönderimde silinir.
    @Column(columnDefinition = "text")
    @ToString.Exclude
    private String draftAnswers;

    private LocalDateTime draftSavedDateTime;
}
