package com.example.demo.service.impl;

import com.example.demo.dao.entity.*;
import com.example.demo.dao.repository.QuestionRepository;
import com.example.demo.dao.repository.SurveyParticipantRepository;
import com.example.demo.dao.repository.SurveyRepository;
import com.example.demo.dao.repository.SurveySubmissionRepository;
import com.example.demo.dto.ParticipantSurveyResponse;
import com.example.demo.dto.SubmitSurveyRequest;
import com.example.demo.exception.InvitationAccessException;
import com.example.demo.exception.InvitationAccessException.Reason;
import com.example.demo.security.InvitationTokenService;
import com.example.demo.service.ParticipantSurveyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParticipantSurveyServiceImpl implements ParticipantSurveyService {

    static final int MAX_DRAFT_LENGTH = 64 * 1024;
    static final int MAX_FREE_TEXT_LENGTH = 2000; // SubmissionAnswer.text sütun uzunluğu
    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final SurveyParticipantRepository participantRepository;
    private final QuestionRepository questionRepository;
    private final SurveySubmissionRepository submissionRepository;
    private final SurveyRepository surveyRepository;
    private final InvitationTokenService tokenService;

    @Override
    @Transactional
    public ParticipantSurveyResponse getSurvey(Long surveyId, String token) {
        SurveyParticipant participant = resolveParticipant(surveyId, token, false);
        LocalDateTime now = LocalDateTime.now();

        // Tamamlama süresi (FR-70) ilk açılıştan nihai gönderime kadar ölçülür
        if (participant.getStartedDateTime() == null) {
            participant.setStartedDateTime(now);
        }
        participant.setInvitationStatus(InvitationStatus.STARTED);
        participant.setLastAccessDateTime(now);

        Survey survey = participant.getSurvey();
        List<ParticipantSurveyResponse.Question> questions = questionRepository
                .findAllWithAnswersBySurveyId(survey.getId()).stream()
                .map(this::toQuestionResponse)
                .toList();

        return new ParticipantSurveyResponse(
                survey.getId(),
                survey.getTitle(),
                survey.getDescription(),
                survey.getEndDate(),
                Boolean.TRUE.equals(survey.getIsAnonymous()),
                questions,
                participant.getDraftAnswers()
        );
    }

    @Override
    @Transactional
    public void saveDraft(Long surveyId, String token, String draftJson) {
        SurveyParticipant participant = resolveParticipant(surveyId, token, true);

        if (!StringUtils.hasText(draftJson) || draftJson.length() > MAX_DRAFT_LENGTH) {
            throw new IllegalArgumentException("Taslak yanıt boş veya çok büyük.");
        }
        JsonNode node;
        try {
            node = JSON.readTree(draftJson);
        } catch (JacksonException e) {
            throw new IllegalArgumentException("Taslak yanıt geçerli bir JSON değil.");
        }
        if (node == null || !node.isObject()) {
            throw new IllegalArgumentException("Taslak yanıt bir JSON nesnesi olmalıdır.");
        }

        LocalDateTime now = LocalDateTime.now();
        participant.setDraftAnswers(node.toString());
        participant.setDraftSavedDateTime(now);
        participant.setLastAccessDateTime(now);
        participant.setInvitationStatus(InvitationStatus.STARTED);
        if (participant.getStartedDateTime() == null) {
            participant.setStartedDateTime(now);
        }
    }

    @Override
    @Transactional
    public void submit(Long surveyId, String token, SubmitSurveyRequest request) {
        SurveyParticipant participant = resolveParticipant(surveyId, token, true);
        Survey survey = participant.getSurvey();
        List<Question> questions = questionRepository.findAllWithAnswersBySurveyId(survey.getId());

        Map<Long, SubmitSurveyRequest.Answer> answerMap = indexAnswers(questions, request);
        LocalDateTime now = LocalDateTime.now();

        SurveySubmission submission = new SurveySubmission();
        submission.setSurvey(survey);
        // BR-06: anonim modda yanıt kaydı ile katılımcı arasında ilişki tutulmaz
        submission.setParticipant(Boolean.TRUE.equals(survey.getIsAnonymous()) ? null : participant);
        submission.setSubmittedDateTime(now);

        for (Question question : questions) {
            SubmitSurveyRequest.Answer answer = answerMap.get(question.getId());
            if (isEmpty(question, answer)) {
                if (!Boolean.TRUE.equals(question.getIsOptional())) {
                    throw new IllegalArgumentException(question.getQuestionOrder() + ". soru zorunludur: "
                            + question.getQuestionText());
                }
                continue;
            }
            submission.getSubmissionAnswerList().addAll(toSubmissionAnswers(submission, question, answer));
        }

        submissionRepository.save(submission);

        // Token nihai gönderimde tüketilir (§3.3): hash silinmez, COMPLETED durumu tekrar erişimde
        // "zaten yanıtladınız" bilgisinin gösterilmesini sağlar.
        if (participant.getStartedDateTime() == null) {
            participant.setStartedDateTime(now);
        }
        participant.setIsResponded(true);
        participant.setRespondedDateTime(now);
        participant.setInvitationStatus(InvitationStatus.COMPLETED);
        participant.setLastAccessDateTime(now);
        participant.setDraftAnswers(null);
        participant.setDraftSavedDateTime(null);
        // Anketlerim listesindeki yanıt oranı bu sayaçtan okunur. Katılımcı satırı kilitli olduğundan
        // aynı token ile iki kez artırılamaz.
        surveyRepository.incrementResponseCount(survey.getId());
        log.info("Anket yanıtı alındı (surveyId={}, anonim={}).", survey.getId(), survey.getIsAnonymous());
    }

    /**
     * Token'ı doğrular. Sıra önemlidir: önce token/davet, sonra "zaten yanıtlandı", en son süre kontrolü.
     * Token geçerliliği anketin bitiş tarihinden türetilir (BR-02); tarih uzatılınca link tekrar çalışır (AS-04).
     */
    private SurveyParticipant resolveParticipant(Long surveyId, String token, boolean forUpdate) {
        if (!StringUtils.hasText(token)) {
            throw new InvitationAccessException(Reason.INVALID);
        }
        String tokenHash = tokenService.hash(token.trim());
        Optional<SurveyParticipant> found = forUpdate
                ? participantRepository.findByTokenHashForUpdate(tokenHash)
                : participantRepository.findByTokenHash(tokenHash);

        SurveyParticipant participant = found
                .filter(p -> p.getSurvey() != null && Objects.equals(p.getSurvey().getId(), surveyId))
                .orElseThrow(() -> new InvitationAccessException(Reason.INVALID));

        if (participant.getInvitationStatus() == InvitationStatus.CANCELLED) {
            throw new InvitationAccessException(Reason.INVALID);
        }
        if (Boolean.TRUE.equals(participant.getIsResponded())
                || participant.getInvitationStatus() == InvitationStatus.COMPLETED) {
            throw new InvitationAccessException(Reason.ANSWERED);
        }

        Survey survey = participant.getSurvey();
        if (survey.getStatus() == Status.DRAFT) {
            throw new InvitationAccessException(Reason.INVALID);
        }
        boolean pastEndDate = survey.getEndDate() != null && !survey.getEndDate().isAfter(LocalDateTime.now());
        if (survey.getStatus() == Status.CLOSED || survey.getStatus() == Status.OUTDATED || pastEndDate) {
            throw new InvitationAccessException(Reason.EXPIRED);
        }
        return participant;
    }

    private Map<Long, SubmitSurveyRequest.Answer> indexAnswers(List<Question> questions, SubmitSurveyRequest request) {
        Map<Long, Question> questionMap = questions.stream()
                .collect(Collectors.toMap(Question::getId, Function.identity()));
        Map<Long, SubmitSurveyRequest.Answer> answerMap = new HashMap<>();
        if (request == null || request.answers() == null) {
            return answerMap;
        }
        for (SubmitSurveyRequest.Answer answer : request.answers()) {
            if (answer == null || answer.questionId() == null) {
                throw new IllegalArgumentException("Yanıtta soru bilgisi eksik.");
            }
            if (!questionMap.containsKey(answer.questionId())) {
                throw new IllegalArgumentException("Ankete ait olmayan bir soru için yanıt gönderildi.");
            }
            if (answerMap.putIfAbsent(answer.questionId(), answer) != null) {
                throw new IllegalArgumentException("Aynı soru için birden fazla yanıt gönderildi.");
            }
        }
        return answerMap;
    }

    private boolean isEmpty(Question question, SubmitSurveyRequest.Answer answer) {
        if (answer == null) {
            return true;
        }
        if (question.getType() == QuestionType.FREETEXT) {
            return !StringUtils.hasText(answer.text());
        }
        return CollectionUtils.isEmpty(answer.optionIds());
    }

    private List<SubmissionAnswer> toSubmissionAnswers(
            SurveySubmission submission,
            Question question,
            SubmitSurveyRequest.Answer answer
    ) {
        if (question.getType() == QuestionType.FREETEXT) {
            String text = answer.text().trim();
            if (text.length() > MAX_FREE_TEXT_LENGTH) {
                throw new IllegalArgumentException(question.getQuestionOrder() + ". soru için yanıt en fazla "
                        + MAX_FREE_TEXT_LENGTH + " karakter olabilir.");
            }
            return List.of(newSubmissionAnswer(submission, question, null, text));
        }

        Map<Long, Answer> optionMap = question.getAnswerList().stream()
                .collect(Collectors.toMap(Answer::getId, Function.identity()));
        Set<Long> selectedIds = new LinkedHashSet<>(answer.optionIds());
        if (selectedIds.contains(null) || !optionMap.keySet().containsAll(selectedIds)) {
            throw new IllegalArgumentException(question.getQuestionOrder() + ". soru için geçersiz seçenek gönderildi.");
        }
        if (question.getType() != QuestionType.MULTIPLE_CHOICE && selectedIds.size() != 1) {
            throw new IllegalArgumentException(question.getQuestionOrder() + ". soru için tek bir seçenek seçilmelidir.");
        }

        return selectedIds.stream()
                .map(id -> newSubmissionAnswer(submission, question, optionMap.get(id), null))
                .toList();
    }

    private SubmissionAnswer newSubmissionAnswer(SurveySubmission submission, Question question, Answer option, String text) {
        SubmissionAnswer submissionAnswer = new SubmissionAnswer();
        submissionAnswer.setSubmission(submission);
        submissionAnswer.setQuestion(question);
        submissionAnswer.setAnswer(option);
        submissionAnswer.setText(text);
        return submissionAnswer;
    }

    private ParticipantSurveyResponse.Question toQuestionResponse(Question question) {
        List<ParticipantSurveyResponse.Option> options = question.getAnswerList().stream()
                .sorted(Comparator.comparing(Answer::getAnswerOrder, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(a -> new ParticipantSurveyResponse.Option(a.getId(), a.getAnswerOrder(), a.getText()))
                .toList();
        return new ParticipantSurveyResponse.Question(
                question.getId(),
                question.getQuestionText(),
                question.getType(),
                question.getQuestionOrder(),
                !Boolean.TRUE.equals(question.getIsOptional()),
                question.getSectionTitle(),
                question.getType() == QuestionType.FREETEXT ? List.of() : options
        );
    }
}
