package com.example.demo.dao.repository;

import com.example.demo.dao.entity.SurveyTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SurveyTemplateRepository
        extends JpaRepository<SurveyTemplate, Long> {
}