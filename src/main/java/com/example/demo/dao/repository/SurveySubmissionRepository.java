package com.example.demo.dao.repository;

import com.example.demo.dao.entity.SurveySubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SurveySubmissionRepository extends JpaRepository<SurveySubmission, Long> {

}
