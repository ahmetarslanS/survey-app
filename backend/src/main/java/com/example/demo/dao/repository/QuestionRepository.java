package com.example.demo.dao.repository;

import com.example.demo.dao.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    // Questions are fetched together with their options to avoid a separate query per question.
    @Query("""
            select distinct q
            from Question q
            left join fetch q.answerList
            where q.survey.id = :surveyId
            order by q.questionOrder asc
            """)
    List<Question> findAllWithAnswersBySurveyId(@Param("surveyId") Long surveyId);
}
