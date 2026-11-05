package com.example.demo.dao.repository;

import com.example.demo.dao.entity.Survey;
import com.example.demo.dao.projection.SurveyListProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SurveyRepository extends JpaRepository<Survey, Long> {

    // Sayaçlar Survey üzerinde tutulduğu için liste katılımcı tablosuna join yapmadan tek tablodan okunur.
    @Query("""
            select s.id as id,
                   s.title as title,
                   s.description as description,
                   s.status as status,
                   s.endDate as endDate,
                   s.participantCount as participantCount,
                   s.responseCount as responseCount
            from Survey s
            order by s.createdDateTime desc
            """)
    List<SurveyListProjection> findAllWithParticipantStats();

    /**
     * Yanıt sayacını veritabanında atomik olarak artırır; eşzamanlı gönderimlerde sayım kaybolmaz.
     * Native sorgu: response_count kolonu entity'de updatable=false olduğundan JPQL yerine doğrudan SQL kullanılır.
     */
    @Modifying
    @Query(value = "update survey set response_count = response_count + 1 where id = :surveyId", nativeQuery = true)
    int incrementResponseCount(@Param("surveyId") Long surveyId);
}
