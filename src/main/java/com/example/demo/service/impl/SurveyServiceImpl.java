package com.example.demo.service.impl;
import com.example.demo.dao.entity.Status;
import com.example.demo.dao.entity.Survey;
import com.example.demo.dao.repository.SurveyRepository;
import com.example.demo.dto.CreateSurveyRequest;
import com.example.demo.dto.SurveyStatusResponse;
import com.example.demo.dto.UpdateSurveyStatusRequest;
import com.example.demo.exception.InvalidSurveyStatusTransitionException;
import com.example.demo.exception.SurveyNotFoundException;
import com.example.demo.service.SurveyService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;


@Slf4j
@Service
@RequiredArgsConstructor
public class SurveyServiceImpl implements SurveyService {

    private final SurveyRepository surveyRepository;


    @Override
    @Transactional
    public Survey createSurvey(CreateSurveyRequest request) {
        Survey surveyEntity = new Survey();
        return surveyEntity;
    }
        @Transactional
    public SurveyStatusResponse updateStatus(
            Long surveyId,
            UpdateSurveyStatusRequest request
    ) {
        // 1. Request içinde statü gönderilmiş mi?
        if (request.status() == null) {
            throw new IllegalArgumentException(
                    "Güncellenecek statü boş olamaz."
            );
        }

        // 2. Anket veritabanından bulunur
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() ->
                        new SurveyNotFoundException(surveyId)
                );

        // 3. Mevcut ve hedef statü alınır
        Status currentStatus = survey.getStatus();
        Status targetStatus = request.status();

        // 4. Statü geçişi uygun mu kontrol edilir
        validateStatusTransition(currentStatus, targetStatus);

        // 5. Statü ve güncelleme zamanı değiştirilir
        survey.setStatus(targetStatus);
        survey.setUpdatedDateTime(LocalDateTime.now());

        // 6. Veritabanına kaydedilir
        Survey updatedSurvey = surveyRepository.save(survey);

        // 7. Güncel bilgiler response olarak döndürülür
        return new SurveyStatusResponse(
                updatedSurvey.getId(),
                updatedSurvey.getStatus(),
                updatedSurvey.getStatus().getDescription(),
                updatedSurvey.getUpdatedDateTime()
        );
    }

    private void validateStatusTransition(
            Status currentStatus,
            Status targetStatus
    ) {
        if (currentStatus == null) {
            throw new IllegalStateException(
                    "Anketin mevcut statüsü bulunamadı."
            );
        }

        boolean validTransition = switch (currentStatus) {
            case DRAFT ->
                    targetStatus == Status.LIVE;

            case LIVE ->
                    targetStatus == Status.CLOSED
                            || targetStatus == Status.OUTDATED;

            case OUTDATED ->
                    targetStatus == Status.LIVE
                            || targetStatus == Status.CLOSED;

            case CLOSED -> false;
        };

        if (!validTransition) {
            throw new InvalidSurveyStatusTransitionException(
                    currentStatus,
                    targetStatus
            );
        }
    }
}
