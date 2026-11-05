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
@Table(name = "survey")
public class Survey {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    private LocalDateTime endDate;
    private Boolean isAnonymous;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.DRAFT;
    private LocalDateTime createdDateTime;
    private LocalDateTime updatedDateTime;

    /*
     * Anketlerim listesi için önceden hesaplanmış sayaçlar: liste her açıldığında survey_participant tablosunu
     * join edip saymamak için tutulur.
     * - participantCount: katılımcı listesi yalnızca oluşturma/taslak düzenlemede değişir, applyContent set eder.
     * - responseCount: yalnızca SurveyRepository.incrementResponseCount (atomik UPDATE) ile artar. updatable=false,
     *   böylece eşzamanlı bir yanıt sırasında başka bir işlemin elindeki eski Survey nesnesini kaydetmesi sayacı geri
     *   yazamaz.
     */
    @Column(nullable = false)
    private long participantCount = 0;

    @Column(nullable = false, updatable = false)
    private long responseCount = 0;

    @OneToMany(mappedBy = "survey", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("questionOrder ASC")
    private List<Question> questionList = new ArrayList<>();

    @OneToMany(mappedBy = "survey", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SurveyParticipant> participantList = new ArrayList<>();
    public void addQuestion(Question question) {
        questionList.add(question);
        question.setSurvey(this);
    }
    
}
