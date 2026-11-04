package com.example.demo.dao.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "question")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Survey survey;

    private String questionText;
    private Integer questionOrder;

    @Enumerated(EnumType.STRING)
    private QuestionType type;

    private Boolean isOptional;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("answerOrder ASC")
    private List<Answer> answerList = new ArrayList<>();

    public void addAnswer(Answer answer) {
    answerList.add(answer);
    answer.setQuestion(this);
}

}
