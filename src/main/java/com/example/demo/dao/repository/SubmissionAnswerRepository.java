package com.example.demo.dao.repository;

import com.example.demo.dao.entity.SubmissionAnswer;
import com.example.demo.dao.projection.FreeTextAnswerProjection;
import com.example.demo.dao.projection.OptionCountProjection;
import com.example.demo.dao.projection.QuestionAnsweredCountProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionAnswerRepository extends JpaRepository<SubmissionAnswer, Long> {

    // How many times each option of the survey was selected.
    @Query("""
            select sa.answer.id as answerId,
                   count(sa.id) as selectedCount
            from SubmissionAnswer sa
            where sa.submission.survey.id = :surveyId
              and sa.answer is not null
            group by sa.answer.id
            """)
    List<OptionCountProjection> countSelectedOptionsBySurveyId(@Param("surveyId") Long surveyId);

    // How many submissions answered each question. A MULTIPLE_CHOICE question answered
    // with several options in one submission is counted once.
    @Query("""
            select sa.question.id as questionId,
                   count(distinct sa.submission.id) as answeredCount
            from SubmissionAnswer sa
            where sa.submission.survey.id = :surveyId
            group by sa.question.id
            """)
    List<QuestionAnsweredCountProjection> countAnsweredQuestionsBySurveyId(@Param("surveyId") Long surveyId);

    @Query("""
            select sa.question.id as questionId,
                   sa.text as text
            from SubmissionAnswer sa
            where sa.submission.survey.id = :surveyId
              and sa.text is not null
            order by sa.submission.submittedDateTime asc, sa.id asc
            """)
    List<FreeTextAnswerProjection> findFreeTextAnswersBySurveyId(@Param("surveyId") Long surveyId);
}
