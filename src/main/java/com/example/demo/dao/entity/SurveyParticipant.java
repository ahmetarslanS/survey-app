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
    private LocalDateTime respondedDateTime;
}
