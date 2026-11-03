package com.example.demo.service.impl;

import com.example.demo.dao.entity.*;
import com.example.demo.dao.projection.SurveyListProjection;
import com.example.demo.dao.repository.SurveyRepository;
import com.example.demo.dto.AdminSurveyListResponse;
import com.example.demo.dao.entity.Status;
import com.example.demo.dao.entity.Survey;
import com.example.demo.dao.repository.SurveyRepository;
import com.example.demo.dto.CreateSurveyRequest;
import com.example.demo.dto.SurveyStatusResponse;
import com.example.demo.dto.UpdateSurveyStatusRequest;
import com.example.demo.exception.InvalidSurveyStatusTransitionException;
import com.example.demo.exception.SurveyNotFoundException;
import com.example.demo.service.MailService;
import com.example.demo.service.SurveyService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;


@Slf4j
@Service
@RequiredArgsConstructor
public class SurveyServiceImpl implements SurveyService {

    private final SurveyRepository surveyRepository;
    private final MailService mailService;

    private static final List<String> LIKERT_OPTIONS = List.of(
            "Kesinlikle Katılmıyorum",
            "Katılmıyorum",
            "Normal",
            "Katılıyorum",
            "Kesinlikle Katılıyorum"
    );

    private static final int MIN_CHOICE_OPTION_COUNT = 2;

    @Override
    @Transactional
    public Survey createSurvey(CreateSurveyRequest request) {
        Survey survey = new Survey();
        if (request != null) {
            survey.setTitle(request.getTitle());
            survey.setDescription(request.getDescription());
            survey.setStatus(Status.LIVE);
            survey.setEndDate(request.getEndDate());
            survey.setIsAnonymous(request.getIsAnonymous());
            survey.setCreatedDateTime(LocalDateTime.now());
            survey.setUpdatedDateTime(LocalDateTime.now());

            if (!CollectionUtils.isEmpty(request.getQuestionList())) {
                List<Question> questionList = request.getQuestionList();
                for (int i = 0; i < questionList.size(); i++) {
                    addQuestions(survey, questionList.get(i), i + 1);
                }
            }

            addParticipants(survey, request.getParticipantMails());
        }
        Survey surveyEntity = surveyRepository.save(survey);
        surveyRepository.flush();

        try {
            mailService.sendSimpleMail(request.getParticipantMails(), surveyEntity.getTitle(),
                    surveyEntity.getDescription(), surveyEntity);
        } catch (Exception e) {
            log.debug("Mail gönderme işlemi esnasında bir hata oluştu. :( ", e);
        }

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

    @Override
    public List<AdminSurveyListResponse> getAllSurveys() {
        return surveyRepository.findAllWithParticipantStats().stream()
                .map(this::toAdminSurveyListResponse)
                .toList();
    }

    private AdminSurveyListResponse toAdminSurveyListResponse(SurveyListProjection projection) {
        AdminSurveyListResponse response = new AdminSurveyListResponse();
        response.setId(projection.getId());
        response.setTitle(projection.getTitle());
        response.setDescription(projection.getDescription());
        response.setStatus(projection.getStatus());
        response.setEndDate(projection.getEndDate());
        response.setParticipantCount(projection.getParticipantCount());
        response.setResponseCount(projection.getResponseCount());
        response.setResponseRate(calculateResponseRate(projection.getResponseCount(), projection.getParticipantCount()));
        return response;
    }

    private BigDecimal calculateResponseRate(Long responseCount, Long participantCount) {
        if (participantCount == null || participantCount == 0) {
            return BigDecimal.ZERO;
        }
        long safeResponseCount = responseCount != null ? responseCount : 0;
        return BigDecimal.valueOf(safeResponseCount)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(participantCount), 2, RoundingMode.HALF_UP);
    }

    private void addParticipants(Survey surveyEntity, List<String> participantMails) {
        if (CollectionUtils.isEmpty(participantMails)) {
            return;
        }

        // Same mail can be sent more than once in the request, each participant is saved once.
        participantMails.stream()
                .filter(StringUtils::hasText)
                .map(mail -> mail.trim().toLowerCase())
                .distinct()
                .forEach(mail -> {
                    SurveyParticipant participantEntity = new SurveyParticipant();
                    participantEntity.setSurvey(surveyEntity);
                    participantEntity.setEmail(mail);
                    participantEntity.setIsResponded(false);
                    surveyEntity.getParticipantList().add(participantEntity);
                });
    }

    private void addQuestions(Survey surveyEntity, Question questionRequest, int defaultOrder) {
        if (questionRequest.getType() == null) {
            throw new IllegalArgumentException("Question type is required");
        }

        Question questionEntity = new Question();
        questionEntity.setSurvey(surveyEntity);
        questionEntity.setQuestionText(questionRequest.getQuestionText());
        questionEntity.setType(questionRequest.getType());
        questionEntity.setIsOptional(Boolean.TRUE.equals(questionRequest.getIsOptional()));
        questionEntity.setQuestionOrder(
                questionRequest.getQuestionOrder() != null ? questionRequest.getQuestionOrder() : defaultOrder);

        switch (questionRequest.getType()) {
            case LIKERT -> addLikertAnswers(questionEntity);
            case SINGLE_CHOICE, MULTIPLE_CHOICE -> addChoiceAnswers(questionEntity, questionRequest.getAnswerList());
            case FREETEXT -> {
            }
        }

        surveyEntity.getQuestionList().add(questionEntity);
    }

    private void addLikertAnswers(Question questionEntity) {
        for (int i = 0; i < LIKERT_OPTIONS.size(); i++) {
            addAnswer(questionEntity, i + 1, LIKERT_OPTIONS.get(i));
        }
    }

    private void addChoiceAnswers(Question questionEntity, List<Answer> answerRequestList) {
        if (CollectionUtils.isEmpty(answerRequestList) || answerRequestList.size() < MIN_CHOICE_OPTION_COUNT) {
            throw new IllegalArgumentException(
                    questionEntity.getType().getDescription() + " sorusu en az " + MIN_CHOICE_OPTION_COUNT + " seçenek içermelidir");
        }

        for (int i = 0; i < answerRequestList.size(); i++) {
            Answer answerRequest = answerRequestList.get(i);
            int answerOrder = answerRequest.getAnswerOrder() != null ? answerRequest.getAnswerOrder() : i + 1;
            addAnswer(questionEntity, answerOrder, answerRequest.getText());
        }
    }

    private void addAnswer(Question questionEntity, int answerOrder, String text) {
        Answer answerEntity = new Answer();
        answerEntity.setQuestion(questionEntity);
        answerEntity.setAnswerOrder(answerOrder);
        answerEntity.setText(text);
        questionEntity.getAnswerList().add(answerEntity);
    }

}
