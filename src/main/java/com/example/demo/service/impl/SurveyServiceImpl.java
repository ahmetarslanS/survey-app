package com.example.demo.service.impl;

import com.example.demo.dao.entity.*;
import com.example.demo.dao.projection.CompletionTimeProjection;
import com.example.demo.dao.projection.FreeTextAnswerProjection;
import com.example.demo.dao.projection.OptionCountProjection;
import com.example.demo.dao.projection.ParticipantStatsProjection;
import com.example.demo.dao.projection.QuestionAnsweredCountProjection;
import com.example.demo.dao.projection.SurveyListProjection;
import com.example.demo.dao.repository.QuestionRepository;
import com.example.demo.dao.repository.SubmissionAnswerRepository;
import com.example.demo.dao.repository.SurveyParticipantRepository;
import com.example.demo.dao.repository.SurveyRepository;
import com.example.demo.dto.AdminSurveyListResponse;
import com.example.demo.dto.OptionReportResponse;
import com.example.demo.dto.QuestionReportResponse;
import com.example.demo.dto.SurveyReportResponse;
import com.example.demo.dao.entity.Status;
import com.example.demo.dao.entity.Survey;
import com.example.demo.dao.repository.SurveyRepository;
import com.example.demo.dto.CreateSurveyRequest;
import com.example.demo.dto.SurveyUpdateResponse;
import com.example.demo.dto.UpdateSurveyRequest;
import com.example.demo.exception.InvalidSurveyStatusTransitionException;
import com.example.demo.exception.SurveyNotFoundException;
import com.example.demo.service.MailService;
import com.example.demo.service.SurveyService;
import com.example.demo.util.ParticipantCsvParser;
import org.springframework.web.multipart.MultipartFile;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;
import java.util.Set;
import java.util.stream.Collectors;


@Slf4j
@Service
@RequiredArgsConstructor
public class SurveyServiceImpl implements SurveyService {

    private final SurveyRepository surveyRepository;
    private final QuestionRepository questionRepository;
    private final SurveyParticipantRepository surveyParticipantRepository;
    private final SubmissionAnswerRepository submissionAnswerRepository;
    private final MailService mailService;
    private final ParticipantCsvParser participantCsvParser;

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

    @Override
    @Transactional
    public Survey createSurvey(CreateSurveyRequest request, MultipartFile participantFile) {
        if (request == null) {
            throw new IllegalArgumentException("Anket bilgileri (request) boş olamaz.");
        }

        if (participantFile != null && !participantFile.isEmpty()) {
            List<String> fileMails = participantCsvParser.parse(participantFile);

            // Mails from the request and the file are merged, so the invitation mail is sent once per address.
            Set<String> mergedMails = new LinkedHashSet<>();
            if (request.getParticipantMails() != null) {
                request.getParticipantMails().stream()
                        .filter(StringUtils::hasText)
                        .map(mail -> mail.trim().toLowerCase())
                        .forEach(mergedMails::add);
            }
            mergedMails.addAll(fileMails);
            request.setParticipantMails(new ArrayList<>(mergedMails));
        }

        return createSurvey(request);
    }

    @Override
    @Transactional
    public SurveyUpdateResponse updateSurvey(
            Long surveyId,
            UpdateSurveyRequest request
    ) {
        if (request == null || (request.status() == null && request.endDate() == null)) {
            throw new IllegalArgumentException(
                    "Güncellenecek en az bir alan (status, endDate) gönderilmelidir."
            );
        }

        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() ->
                        new SurveyNotFoundException(surveyId)
                );

        Status currentStatus = survey.getStatus();
        Status targetStatus = resolveTargetStatus(currentStatus, request);

        // Both fields are validated before any change, so a request is never applied partially.
        if (targetStatus != currentStatus) {
            validateStatusTransition(currentStatus, targetStatus);
        }
        if (request.endDate() != null) {
            validateEndDate(currentStatus, targetStatus, request.endDate());
        }

        survey.setStatus(targetStatus);
        if (request.endDate() != null) {
            survey.setEndDate(request.endDate());
        }
        survey.setUpdatedDateTime(LocalDateTime.now());

        Survey updatedSurvey = surveyRepository.save(survey);

        return new SurveyUpdateResponse(
                updatedSurvey.getId(),
                updatedSurvey.getStatus(),
                updatedSurvey.getStatus().getDescription(),
                updatedSurvey.getEndDate(),
                updatedSurvey.getUpdatedDateTime()
        );
    }

    private Status resolveTargetStatus(Status currentStatus, UpdateSurveyRequest request) {
        if (request.status() != null) {
            return request.status();
        }
        // Extending the end date of an outdated survey reopens it.
        if (request.endDate() != null && currentStatus == Status.OUTDATED) {
            return Status.LIVE;
        }
        return currentStatus;
    }

    private void validateEndDate(
            Status currentStatus,
            Status targetStatus,
            LocalDateTime endDate
    ) {
        if (!endDate.isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException(
                    "Son katılım tarihi ileri bir tarih olmalıdır."
            );
        }
        if (currentStatus == Status.CLOSED) {
            throw new IllegalArgumentException(
                    "Kapanmış anketin son katılım tarihi güncellenemez."
            );
        }
        if (targetStatus == Status.CLOSED || targetStatus == Status.OUTDATED) {
            throw new IllegalArgumentException(
                    targetStatus.getDescription() + " statüsüne geçilirken son katılım tarihi güncellenemez."
            );
        }
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

    @Override
    @Transactional
    public SurveyReportResponse getSurveyReport(Long surveyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new SurveyNotFoundException(surveyId));

        List<Question> questionList = questionRepository.findAllWithAnswersBySurveyId(surveyId);
        ParticipantStatsProjection participantStats =
                surveyParticipantRepository.findParticipantStatsBySurveyId(surveyId);
        List<CompletionTimeProjection> completionTimeList =
                surveyParticipantRepository.findCompletionTimesBySurveyId(surveyId);

        // Answer counts are loaded once for the whole survey and matched to the questions by id.
        Map<Long, Long> selectedCountMap = submissionAnswerRepository.countSelectedOptionsBySurveyId(surveyId)
                .stream()
                .collect(Collectors.toMap(OptionCountProjection::getAnswerId, OptionCountProjection::getSelectedCount));
        Map<Long, Long> answeredCountMap = submissionAnswerRepository.countAnsweredQuestionsBySurveyId(surveyId)
                .stream()
                .collect(Collectors.toMap(QuestionAnsweredCountProjection::getQuestionId,
                        QuestionAnsweredCountProjection::getAnsweredCount));
        Map<Long, List<String>> freeTextAnswerMap = submissionAnswerRepository.findFreeTextAnswersBySurveyId(surveyId)
                .stream()
                .collect(Collectors.groupingBy(FreeTextAnswerProjection::getQuestionId,
                        Collectors.mapping(FreeTextAnswerProjection::getText, Collectors.toList())));

        long participantCount = participantStats != null && participantStats.getParticipantCount() != null
                ? participantStats.getParticipantCount() : 0;
        long responseCount = participantStats != null && participantStats.getResponseCount() != null
                ? participantStats.getResponseCount() : 0;

        SurveyReportResponse report = new SurveyReportResponse();
        report.setSurveyId(survey.getId());
        report.setTitle(survey.getTitle());
        report.setDescription(survey.getDescription());
        report.setStatus(survey.getStatus());
        report.setStatusDescription(survey.getStatus() != null ? survey.getStatus().getDescription() : null);
        report.setEndDate(survey.getEndDate());
        report.setIsAnonymous(survey.getIsAnonymous());
        report.setParticipantCount(participantCount);
        report.setResponseCount(responseCount);
        report.setParticipationRate(calculateResponseRate(responseCount, participantCount));
        setAverageCompletionTime(report, completionTimeList);

        List<OptionReportResponse> allLikertOptionList = new ArrayList<>();
        for (Question question : questionList) {
            QuestionReportResponse questionReport = toQuestionReport(
                    question, responseCount, answeredCountMap, selectedCountMap, freeTextAnswerMap);
            report.getQuestionReports().add(questionReport);

            if (question.getType() == QuestionType.LIKERT) {
                allLikertOptionList.addAll(questionReport.getOptions());
            }
        }
        // Weighted average of all LIKERT answers, not the average of the question averages.
        report.setSatisfactionAverage(calculateLikertAverage(allLikertOptionList));

        return report;
    }

    private QuestionReportResponse toQuestionReport(
            Question question,
            long responseCount,
            Map<Long, Long> answeredCountMap,
            Map<Long, Long> selectedCountMap,
            Map<Long, List<String>> freeTextAnswerMap
    ) {
        long answeredCount = answeredCountMap.getOrDefault(question.getId(), 0L);

        QuestionReportResponse questionReport = new QuestionReportResponse();
        questionReport.setQuestionId(question.getId());
        questionReport.setQuestionText(question.getQuestionText());
        questionReport.setQuestionOrder(question.getQuestionOrder());
        questionReport.setType(question.getType());
        questionReport.setIsOptional(question.getIsOptional());
        questionReport.setAnsweredCount(answeredCount);
        questionReport.setAnsweredRate(calculateResponseRate(answeredCount, responseCount));

        if (question.getType() == QuestionType.FREETEXT) {
            questionReport.setFreeTextAnswers(
                    new ArrayList<>(freeTextAnswerMap.getOrDefault(question.getId(), List.of())));
            return questionReport;
        }

        // Options that were never selected are also returned with a count of 0.
        question.getAnswerList().stream()
                .sorted(Comparator.comparing(Answer::getAnswerOrder))
                .forEach(answer -> {
                    long selectedCount = selectedCountMap.getOrDefault(answer.getId(), 0L);
                    questionReport.getOptions().add(new OptionReportResponse(
                            answer.getId(),
                            answer.getAnswerOrder(),
                            answer.getText(),
                            selectedCount,
                            calculateResponseRate(selectedCount, answeredCount)
                    ));
                });

        if (question.getType() == QuestionType.LIKERT) {
            questionReport.setAverageScore(calculateLikertAverage(questionReport.getOptions()));
        }

        return questionReport;
    }

    // answerOrder of a LIKERT option is its score (1-5).
    private BigDecimal calculateLikertAverage(List<OptionReportResponse> likertOptionList) {
        long totalScore = 0;
        long totalSelectedCount = 0;
        for (OptionReportResponse option : likertOptionList) {
            totalScore += (long) option.getAnswerOrder() * option.getSelectedCount();
            totalSelectedCount += option.getSelectedCount();
        }

        if (totalSelectedCount == 0) {
            return null;
        }
        return BigDecimal.valueOf(totalScore)
                .divide(BigDecimal.valueOf(totalSelectedCount), 2, RoundingMode.HALF_UP);
    }

    private void setAverageCompletionTime(SurveyReportResponse report, List<CompletionTimeProjection> completionTimeList) {
        OptionalDouble averageSeconds = completionTimeList.stream()
                .mapToLong(completionTime -> Duration.between(
                        completionTime.getStartedDateTime(), completionTime.getRespondedDateTime()).getSeconds())
                // Inconsistent records (responded before started) are excluded.
                .filter(seconds -> seconds >= 0)
                .average();

        if (averageSeconds.isEmpty()) {
            return;
        }
        long roundedSeconds = Math.round(averageSeconds.getAsDouble());
        report.setAverageCompletionTimeSeconds(roundedSeconds);
        report.setAverageCompletionTimeText(formatDuration(roundedSeconds));
    }

    // e.g. 45 -> "45 sn", 270 -> "4 dk 30 sn", 3720 -> "1 sa 2 dk"
    private String formatDuration(long totalSeconds) {
        long hours = totalSeconds / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        long seconds = totalSeconds % 60;

        List<String> parts = new ArrayList<>();
        if (hours > 0) {
            parts.add(hours + " sa");
        }
        if (minutes > 0) {
            parts.add(minutes + " dk");
        }
        if (seconds > 0 || parts.isEmpty()) {
            parts.add(seconds + " sn");
        }
        return String.join(" ", parts);
    }

    private void addParticipants(Survey surveyEntity, List<String> participantMails) {
        if (CollectionUtils.isEmpty(participantMails)) {
            return;
        }

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
