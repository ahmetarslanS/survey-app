package com.example.demo.dao.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "template_answer")
public class TemplateAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "template_question_id",
            nullable = false
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private TemplateQuestion templateQuestion;

    @Column(nullable = false)
    private Integer answerOrder;

    @Column(nullable = false)
    private String text;
}