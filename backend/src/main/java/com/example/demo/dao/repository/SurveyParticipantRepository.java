package com.example.demo.dao.repository;

import com.example.demo.dao.entity.SurveyParticipant;
import com.example.demo.dao.projection.CompletionTimeProjection;
import com.example.demo.dao.projection.ParticipantStatsProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SurveyParticipantRepository extends JpaRepository<SurveyParticipant, Long> {

    @Query("""
            select count(p.id) as participantCount,
                   coalesce(sum(case when p.isResponded = true then 1 else 0 end), 0) as responseCount
            from SurveyParticipant p
            where p.survey.id = :surveyId
            """)
    ParticipantStatsProjection findParticipantStatsBySurveyId(@Param("surveyId") Long surveyId);

    // Only participants with both dates are returned, the others are excluded from the average.
    @Query("""
            select p.startedDateTime as startedDateTime,
                   p.respondedDateTime as respondedDateTime
            from SurveyParticipant p
            where p.survey.id = :surveyId
              and p.isResponded = true
              and p.startedDateTime is not null
              and p.respondedDateTime is not null
            """)
    List<CompletionTimeProjection> findCompletionTimesBySurveyId(@Param("surveyId") Long surveyId);
}
