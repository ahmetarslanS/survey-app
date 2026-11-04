package com.example.demo.service.impl;

import com.example.demo.dao.entity.*;
import com.example.demo.dao.repository.QuestionRepository;
import com.example.demo.dao.repository.SurveyParticipantRepository;
import com.example.demo.dao.repository.SurveySubmissionRepository;
import com.example.demo.dto.ParticipantSurveyResponse;
import com.example.demo.dto.SubmitSurveyRequest;
import com.example.demo.exception.InvitationAccessException;
import com.example.demo.exception.InvitationAccessException.Reason;
import com.example.demo.security.InvitationTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class ParticipantSurveyServiceImplTest {

    private static final String TOKEN = "raw-token";

    private final SurveyParticipantRepository participantRepository = mock(SurveyParticipantRepository.class);
    private final QuestionRepository questionRepository = mock(QuestionRepository.class);
    private final SurveySubmissionRepository submissionRepository = mock(SurveySubmissionRepository.class);
    private final InvitationTokenService tokenService = new InvitationTokenService();

    private ParticipantSurveyServiceImpl service;
    private Survey survey;
    private SurveyParticipant participant;
    private Question likert;
    private Question multi;
    private Question freeText;

    @BeforeEach
    void setUp() {
        service = new ParticipantSurveyServiceImpl(participantRepository, questionRepository, submissionRepository, tokenService);

        survey = new Survey();
        survey.setId(10L);
        survey.setTitle("Eğitim Anketi");
        survey.setStatus(Status.LIVE);
        survey.setEndDate(LocalDateTime.now().plusDays(3));
        survey.setIsAnonymous(false);

        participant = new SurveyParticipant();
        participant.setId(5L);
        participant.setSurvey(survey);
        participant.setEmail("a@b.com");
        participant.setIsResponded(false);
        participant.setInvitationStatus(InvitationStatus.SENT);
        participant.setTokenHash(tokenService.hash(TOKEN));

        likert = question(1L, 1, QuestionType.LIKERT, false, 101L, 102L, 103L, 104L, 105L);
        multi = question(2L, 2, QuestionType.MULTIPLE_CHOICE, true, 201L, 202L, 203L);
        freeText = question(3L, 3, QuestionType.FREETEXT, true);

        String hash = tokenService.hash(TOKEN);
        when(participantRepository.findByTokenHash(hash)).thenReturn(Optional.of(participant));
        when(participantRepository.findByTokenHashForUpdate(hash)).thenReturn(Optional.of(participant));
        when(questionRepository.findAllWithAnswersBySurveyId(10L)).thenReturn(List.of(likert, multi, freeText));
    }

    private Question question(Long id, int order, QuestionType type, boolean optional, Long... optionIds) {
        Question q = new Question();
        q.setId(id);
        q.setQuestionOrder(order);
        q.setQuestionText("Soru " + order);
        q.setType(type);
        q.setIsOptional(optional);
        for (int i = 0; i < optionIds.length; i++) {
            Answer a = new Answer();
            a.setId(optionIds[i]);
            a.setAnswerOrder(i + 1);
            a.setText("Seçenek " + (i + 1));
            q.addAnswer(a);
        }
        return q;
    }

    private SubmitSurveyRequest validRequest() {
        return new SubmitSurveyRequest(List.of(
                new SubmitSurveyRequest.Answer(1L, List.of(104L), null),
                new SubmitSurveyRequest.Answer(2L, List.of(201L, 203L), null),
                new SubmitSurveyRequest.Answer(3L, null, "  Çok faydalıydı  ")
        ));
    }

    // ---- getSurvey ----

    @Test
    void getSurveyMarksInvitationStartedAndReturnsQuestions() {
        ParticipantSurveyResponse response = service.getSurvey(10L, TOKEN);

        assertThat(response.surveyId()).isEqualTo(10L);
        assertThat(response.questions()).hasSize(3);
        assertThat(response.questions().get(0).isMandatory()).isTrue();
        assertThat(response.questions().get(0).options()).hasSize(5);
        assertThat(response.questions().get(2).options()).isEmpty();
        assertThat(participant.getInvitationStatus()).isEqualTo(InvitationStatus.STARTED);
        assertThat(participant.getStartedDateTime()).isNotNull();
    }

    @Test
    void missingOrUnknownTokenIsInvalid() {
        assertThatThrownBy(() -> service.getSurvey(10L, null))
                .isInstanceOfSatisfying(InvitationAccessException.class, e -> assertThat(e.getReason()).isEqualTo(Reason.INVALID));
        assertThatThrownBy(() -> service.getSurvey(10L, "other-token"))
                .isInstanceOfSatisfying(InvitationAccessException.class, e -> assertThat(e.getReason()).isEqualTo(Reason.INVALID));
    }

    @Test
    void tokenOfAnotherSurveyIsInvalid() {
        assertThatThrownBy(() -> service.getSurvey(99L, TOKEN))
                .isInstanceOfSatisfying(InvitationAccessException.class, e -> assertThat(e.getReason()).isEqualTo(Reason.INVALID));
    }

    @Test
    void cancelledInvitationIsInvalid() {
        participant.setInvitationStatus(InvitationStatus.CANCELLED);
        assertThatThrownBy(() -> service.getSurvey(10L, TOKEN))
                .isInstanceOfSatisfying(InvitationAccessException.class, e -> assertThat(e.getReason()).isEqualTo(Reason.INVALID));
    }

    @Test
    void answeredInvitationIsRejected() {
        participant.setIsResponded(true);
        participant.setInvitationStatus(InvitationStatus.COMPLETED);
        assertThatThrownBy(() -> service.getSurvey(10L, TOKEN))
                .isInstanceOfSatisfying(InvitationAccessException.class, e -> assertThat(e.getReason()).isEqualTo(Reason.ANSWERED));
    }

    @Test
    void pastEndDateOrClosedSurveyIsExpired() {
        survey.setEndDate(LocalDateTime.now().minusMinutes(1));
        assertThatThrownBy(() -> service.getSurvey(10L, TOKEN))
                .isInstanceOfSatisfying(InvitationAccessException.class, e -> assertThat(e.getReason()).isEqualTo(Reason.EXPIRED));

        survey.setEndDate(LocalDateTime.now().plusDays(1));
        survey.setStatus(Status.CLOSED);
        assertThatThrownBy(() -> service.getSurvey(10L, TOKEN))
                .isInstanceOfSatisfying(InvitationAccessException.class, e -> assertThat(e.getReason()).isEqualTo(Reason.EXPIRED));
    }

    @Test
    void extendedEndDateMakesLinkWorkAgain() {
        survey.setStatus(Status.LIVE);
        survey.setEndDate(LocalDateTime.now().plusDays(7)); // AS-04: süre uzatıldı
        assertThat(service.getSurvey(10L, TOKEN).surveyId()).isEqualTo(10L);
    }

    // ---- saveDraft ----

    @Test
    void draftIsStoredAndReturnedOnNextOpen() {
        service.saveDraft(10L, TOKEN, "{\"1\": 4, \"2\": [1, 3]}");

        assertThat(participant.getDraftAnswers()).isEqualTo("{\"1\":4,\"2\":[1,3]}");
        assertThat(service.getSurvey(10L, TOKEN).draftAnswers()).isEqualTo("{\"1\":4,\"2\":[1,3]}");
    }

    @Test
    void draftMustBeAJsonObject() {
        assertThatThrownBy(() -> service.saveDraft(10L, TOKEN, "not json")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.saveDraft(10L, TOKEN, "[1,2]")).isInstanceOf(IllegalArgumentException.class);
    }

    // ---- submit ----

    @Test
    void submitStoresAnswersAndConsumesToken() {
        participant.setDraftAnswers("{\"1\":4}");

        service.submit(10L, TOKEN, validRequest());

        ArgumentCaptor<SurveySubmission> captor = ArgumentCaptor.forClass(SurveySubmission.class);
        verify(submissionRepository).save(captor.capture());
        SurveySubmission submission = captor.getValue();
        assertThat(submission.getParticipant()).isSameAs(participant);
        assertThat(submission.getSubmissionAnswerList()).hasSize(4); // 1 likert + 2 çoklu + 1 metin
        assertThat(submission.getSubmissionAnswerList())
                .filteredOn(a -> a.getText() != null)
                .singleElement()
                .satisfies(a -> assertThat(a.getText()).isEqualTo("Çok faydalıydı"));

        assertThat(participant.getIsResponded()).isTrue();
        assertThat(participant.getInvitationStatus()).isEqualTo(InvitationStatus.COMPLETED);
        assertThat(participant.getDraftAnswers()).isNull();

        // AS-01: aynı link tekrar kullanılamaz
        assertThatThrownBy(() -> service.submit(10L, TOKEN, validRequest()))
                .isInstanceOfSatisfying(InvitationAccessException.class, e -> assertThat(e.getReason()).isEqualTo(Reason.ANSWERED));
    }

    @Test
    void anonymousSubmissionIsNotLinkedToParticipant() {
        survey.setIsAnonymous(true);

        service.submit(10L, TOKEN, validRequest());

        ArgumentCaptor<SurveySubmission> captor = ArgumentCaptor.forClass(SurveySubmission.class);
        verify(submissionRepository).save(captor.capture());
        assertThat(captor.getValue().getParticipant()).isNull();
        assertThat(participant.getInvitationStatus()).isEqualTo(InvitationStatus.COMPLETED);
    }

    @Test
    void mandatoryQuestionMustBeAnswered() {
        SubmitSurveyRequest request = new SubmitSurveyRequest(List.of(new SubmitSurveyRequest.Answer(3L, null, "metin")));

        assertThatThrownBy(() -> service.submit(10L, TOKEN, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("1. soru zorunludur");
        verifyNoInteractions(submissionRepository);
        assertThat(participant.getIsResponded()).isFalse();
    }

    @Test
    void optionalQuestionsCanBeSkipped() {
        service.submit(10L, TOKEN, new SubmitSurveyRequest(List.of(new SubmitSurveyRequest.Answer(1L, List.of(101L), null))));
        verify(submissionRepository).save(any());
    }

    @Test
    void singleAnswerQuestionRejectsMultipleOptions() {
        SubmitSurveyRequest request = new SubmitSurveyRequest(List.of(new SubmitSurveyRequest.Answer(1L, List.of(101L, 102L), null)));
        assertThatThrownBy(() -> service.submit(10L, TOKEN, request)).hasMessageContaining("tek bir seçenek");
    }

    @Test
    void optionOfAnotherQuestionIsRejected() {
        SubmitSurveyRequest request = new SubmitSurveyRequest(List.of(new SubmitSurveyRequest.Answer(1L, List.of(201L), null)));
        assertThatThrownBy(() -> service.submit(10L, TOKEN, request)).hasMessageContaining("geçersiz seçenek");
    }

    @Test
    void unknownOrDuplicateQuestionIsRejected() {
        SubmitSurveyRequest unknown = new SubmitSurveyRequest(List.of(new SubmitSurveyRequest.Answer(999L, List.of(101L), null)));
        assertThatThrownBy(() -> service.submit(10L, TOKEN, unknown)).hasMessageContaining("Ankete ait olmayan");

        SubmitSurveyRequest duplicate = new SubmitSurveyRequest(List.of(
                new SubmitSurveyRequest.Answer(1L, List.of(101L), null),
                new SubmitSurveyRequest.Answer(1L, List.of(102L), null)));
        assertThatThrownBy(() -> service.submit(10L, TOKEN, duplicate)).hasMessageContaining("birden fazla");
    }

    @Test
    void tooLongFreeTextIsRejected() {
        SubmitSurveyRequest request = new SubmitSurveyRequest(List.of(
                new SubmitSurveyRequest.Answer(1L, List.of(101L), null),
                new SubmitSurveyRequest.Answer(3L, null, "x".repeat(ParticipantSurveyServiceImpl.MAX_FREE_TEXT_LENGTH + 1))));
        assertThatThrownBy(() -> service.submit(10L, TOKEN, request)).hasMessageContaining("en fazla");
    }

    @Test
    void submitAfterEndDateIsRejected() {
        survey.setEndDate(LocalDateTime.now().minusSeconds(1));
        assertThatThrownBy(() -> service.submit(10L, TOKEN, validRequest()))
                .isInstanceOfSatisfying(InvitationAccessException.class, e -> assertThat(e.getReason()).isEqualTo(Reason.EXPIRED));
    }
}
