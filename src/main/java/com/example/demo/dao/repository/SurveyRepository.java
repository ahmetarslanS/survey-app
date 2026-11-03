package com.example.demo.dao.repository;

import com.example.demo.dao.entity.Survey;
import com.example.demo.dao.projection.SurveyListProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SurveyRepository extends JpaRepository<Survey, Long> {

    // Participant and response counts are calculated in a single query to avoid N+1 queries.
    @Query("""
            select s.id as id,
                   s.title as title,
                   s.description as description,
                   s.status as status,
                   s.endDate as endDate,
                   count(p.id) as participantCount,
                   coalesce(sum(case when p.isResponded = true then 1 else 0 end), 0) as responseCount
            from Survey s
            left join s.participantList p
            group by s.id, s.title, s.description, s.status, s.endDate, s.createdDateTime
            order by s.createdDateTime desc
            """)
    List<SurveyListProjection> findAllWithParticipantStats();
}
