package com.example.demo.service.impl;

import com.example.demo.dao.entity.Answer;
import com.example.demo.dao.entity.Question;
import com.example.demo.dao.entity.Status;
import com.example.demo.dao.entity.Survey;
import com.example.demo.dao.entity.SurveyTemplate;
import com.example.demo.dao.entity.TemplateAnswer;
import com.example.demo.dao.entity.TemplateQuestion;
import com.example.demo.dao.repository.SurveyRepository;
import com.example.demo.dao.repository.SurveyTemplateRepository;
import com.example.demo.dto.CreateSurveyFromTemplateRequest;
import com.example.demo.dto.CreateTemplateRequest;
import com.example.demo.dto.SurveyTemplateDetailResponse;
import com.example.demo.dto.SurveyTemplateListResponse;
import com.example.demo.dto.TemplateAnswerResponse;
import com.example.demo.dto.TemplateQuestionResponse;
import com.example.demo.exception.SurveyNotFoundException;
import com.example.demo.service.SurveyTemplateService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SurveyTemplateServiceImpl
        implements SurveyTemplateService {

    private final SurveyRepository surveyRepository;
    private final SurveyTemplateRepository surveyTemplateRepository;

    /**
     * Mevcut anketten bağımsız bir şablon oluşturur.
     * Sorular ve seçenekler kopyalanır.
     * Katılımcılar kopyalanmaz.
     */
    @Override
    @Transactional
    public SurveyTemplateDetailResponse createTemplate(
            Long surveyId,
            CreateTemplateRequest request
    ) {
        validateCreateTemplateRequest(request);

        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() ->
                        new SurveyNotFoundException(surveyId)
                );

        LocalDateTime now = LocalDateTime.now();

        SurveyTemplate template = new SurveyTemplate();
        template.setName(request.name().trim());
        template.setDescription(request.description());
        template.setSourceSurveyId(survey.getId());
        template.setIsAnonymous(survey.getIsAnonymous());
        template.setCreatedDateTime(now);
        template.setUpdatedDateTime(now);

        if (survey.getQuestionList() != null) {
            for (Question sourceQuestion
                    : survey.getQuestionList()) {

                TemplateQuestion templateQuestion =
                        copyQuestionToTemplate(sourceQuestion);

                template.addQuestion(templateQuestion);
            }
        }

        SurveyTemplate savedTemplate =
                surveyTemplateRepository.save(template);

        log.info(
                "Survey template created. templateId={}, surveyId={}",
                savedTemplate.getId(),
                surveyId
        );

        return toDetailResponse(savedTemplate);
    }

    /**
     * Tüm şablonları özet olarak listeler.
     */
    @Override
    @Transactional
    public List<SurveyTemplateListResponse> getAllTemplates() {
        return surveyTemplateRepository.findAll()
                .stream()
                .map(this::toListResponse)
                .toList();
    }

    /**
     * Şablonu, soruları ve seçenekleriyle getirir.
     */
    @Override
    @Transactional
    public SurveyTemplateDetailResponse getTemplate(
            Long templateId
    ) {
        SurveyTemplate template = findTemplate(templateId);

        return toDetailResponse(template);
    }

    /**
     * Şablondan yeni bir DRAFT anket oluşturur.
     */
    @Override
    @Transactional
    public Long createSurveyFromTemplate(
            Long templateId,
            CreateSurveyFromTemplateRequest request
    ) {
        validateCreateSurveyRequest(request);

        SurveyTemplate template = findTemplate(templateId);

        LocalDateTime now = LocalDateTime.now();

        Survey survey = new Survey();
        survey.setTitle(request.title().trim());

        if (request.description() != null) {
            survey.setDescription(request.description());
        } else {
            survey.setDescription(template.getDescription());
        }

        survey.setEndDate(request.endDate());

        if (request.isAnonymous() != null) {
            survey.setIsAnonymous(request.isAnonymous());
        } else {
            survey.setIsAnonymous(template.getIsAnonymous());
        }

        survey.setStatus(Status.DRAFT);
        survey.setCreatedDateTime(now);
        survey.setUpdatedDateTime(now);

        if (template.getQuestionList() != null) {
            for (TemplateQuestion templateQuestion
                    : template.getQuestionList()) {

                Question question =
                        copyTemplateQuestionToSurvey(
                                templateQuestion
                        );

                survey.addQuestion(question);
            }
        }

        /*
         * participantList'e herhangi bir kayıt eklenmiyor.
         * Bu nedenle yeni anket katılımcısız oluşturulur.
         */
        Survey savedSurvey = surveyRepository.save(survey);

        log.info(
                "Survey created from template. surveyId={}, templateId={}",
                savedSurvey.getId(),
                templateId
        );

        return savedSurvey.getId();
    }

    /**
     * Şablonu siler.
     */
    @Override
    @Transactional
    public void deleteTemplate(Long templateId) {
        SurveyTemplate template = findTemplate(templateId);

        surveyTemplateRepository.delete(template);

        log.info(
                "Survey template deleted. templateId={}",
                templateId
        );
    }

    /**
     * Survey sorusunu TemplateQuestion nesnesine kopyalar.
     */
    private TemplateQuestion copyQuestionToTemplate(
            Question sourceQuestion
    ) {
        TemplateQuestion templateQuestion =
                new TemplateQuestion();

        templateQuestion.setQuestionText(
                sourceQuestion.getQuestionText()
        );
        templateQuestion.setQuestionOrder(
                sourceQuestion.getQuestionOrder()
        );
        templateQuestion.setType(
                sourceQuestion.getType()
        );
        templateQuestion.setIsOptional(
                sourceQuestion.getIsOptional()
        );

        if (sourceQuestion.getAnswerList() != null) {
            for (Answer sourceAnswer
                    : sourceQuestion.getAnswerList()) {

                TemplateAnswer templateAnswer =
                        new TemplateAnswer();

                templateAnswer.setAnswerOrder(
                        sourceAnswer.getAnswerOrder()
                );
                templateAnswer.setText(
                        sourceAnswer.getText()
                );

                templateQuestion.addAnswer(templateAnswer);
            }
        }

        return templateQuestion;
    }

    /**
     * TemplateQuestion nesnesini gerçek Question nesnesine kopyalar.
     */
    private Question copyTemplateQuestionToSurvey(
            TemplateQuestion templateQuestion
    ) {
        Question question = new Question();

        question.setQuestionText(
                templateQuestion.getQuestionText()
        );
        question.setQuestionOrder(
                templateQuestion.getQuestionOrder()
        );
        question.setType(
                templateQuestion.getType()
        );
        question.setIsOptional(
                templateQuestion.getIsOptional()
        );

        if (templateQuestion.getAnswerList() != null) {
            for (TemplateAnswer templateAnswer
                    : templateQuestion.getAnswerList()) {

                Answer answer = new Answer();

                answer.setAnswerOrder(
                        templateAnswer.getAnswerOrder()
                );
                answer.setText(
                        templateAnswer.getText()
                );

                question.addAnswer(answer);
            }
        }

        return question;
    }

    /**
     * Şablonu ID üzerinden bulur.
     */
   private SurveyTemplate findTemplate(Long templateId) {
    if (templateId == null) {
        throw new IllegalArgumentException(
                "Şablon id boş olamaz."
        );
    }

    return surveyTemplateRepository
            .findById(templateId)
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Şablon bulunamadı. Template id: "
                                    + templateId
                    )
            );
}

    private void validateCreateTemplateRequest(
            CreateTemplateRequest request
    ) {
        if (request == null) {
            throw new IllegalArgumentException(
                    "Şablon bilgileri boş olamaz."
            );
        }

        if (request.name() == null
                || request.name().isBlank()) {
            throw new IllegalArgumentException(
                    "Şablon adı boş olamaz."
            );
        }
    }

    private void validateCreateSurveyRequest(
            CreateSurveyFromTemplateRequest request
    ) {
        if (request == null) {
            throw new IllegalArgumentException(
                    "Anket bilgileri boş olamaz."
            );
        }

        if (request.title() == null
                || request.title().isBlank()) {
            throw new IllegalArgumentException(
                    "Anket başlığı boş olamaz."
            );
        }

        if (request.endDate() == null) {
            throw new IllegalArgumentException(
                    "Anket bitiş tarihi boş olamaz."
            );
        }

        if (!request.endDate().isAfter(
                LocalDateTime.now()
        )) {
            throw new IllegalArgumentException(
                    "Anket bitiş tarihi gelecekte olmalıdır."
            );
        }
    }

    /**
     * Liste ekranı için özet DTO üretir.
     */
    private SurveyTemplateListResponse toListResponse(
            SurveyTemplate template
    ) {
        int questionCount =
                template.getQuestionList() == null
                        ? 0
                        : template.getQuestionList().size();

        return new SurveyTemplateListResponse(
                template.getId(),
                template.getName(),
                template.getDescription(),
                template.getSourceSurveyId(),
                questionCount,
                template.getCreatedDateTime()
        );
    }

    /**
     * Detay ekranı için şablon DTO'su üretir.
     */
    private SurveyTemplateDetailResponse toDetailResponse(
            SurveyTemplate template
    ) {
        List<TemplateQuestionResponse> questions =
                template.getQuestionList() == null
                        ? List.of()
                        : template.getQuestionList()
                                .stream()
                                .map(this::toQuestionResponse)
                                .toList();

        return new SurveyTemplateDetailResponse(
                template.getId(),
                template.getName(),
                template.getDescription(),
                template.getSourceSurveyId(),
                template.getIsAnonymous(),
                template.getCreatedDateTime(),
                template.getUpdatedDateTime(),
                questions
        );
    }

    /**
     * TemplateQuestion entity'sini response DTO'ya dönüştürür.
     */
    private TemplateQuestionResponse toQuestionResponse(
            TemplateQuestion question
    ) {
        List<TemplateAnswerResponse> answers =
                question.getAnswerList() == null
                        ? List.of()
                        : question.getAnswerList()
                                .stream()
                                .map(answer ->
                                        new TemplateAnswerResponse(
                                                answer.getId(),
                                                answer.getAnswerOrder(),
                                                answer.getText()
                                        )
                                )
                                .toList();

        return new TemplateQuestionResponse(
                question.getId(),
                question.getQuestionText(),
                question.getQuestionOrder(),
                question.getType(),
                question.getIsOptional(),
                answers
        );
    }
}