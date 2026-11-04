package com.example.demo.controllers.admin;

import com.example.demo.dto.CreateSurveyFromTemplateRequest;
import com.example.demo.dto.CreateTemplateRequest;
import com.example.demo.dto.SurveyTemplateDetailResponse;
import com.example.demo.dto.SurveyTemplateListResponse;
import com.example.demo.service.SurveyTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/admin/templates")
@RequiredArgsConstructor
public class SurveyTemplateController {

    private final SurveyTemplateService surveyTemplateService;

    // Mevcut bir anketten şablon oluşturur
    @PostMapping("/from-survey/{surveyId}")
    public ResponseEntity<SurveyTemplateDetailResponse> createTemplate(
            @PathVariable Long surveyId,
            @RequestBody CreateTemplateRequest request
    ) {
        SurveyTemplateDetailResponse response =
                surveyTemplateService.createTemplate(
                        surveyId,
                        request
                );

        return ResponseEntity
                .created(
                        URI.create(
                                "/admin/templates/" + response.id()
                        )
                )
                .body(response);
    }

    // Tüm şablonları özet olarak listeler
    @GetMapping
    public ResponseEntity<List<SurveyTemplateListResponse>>
    getAllTemplates() {
        return ResponseEntity.ok(
                surveyTemplateService.getAllTemplates()
        );
    }

    // Tek bir şablonu soruları ve seçenekleriyle getirir
    @GetMapping("/{templateId}")
    public ResponseEntity<SurveyTemplateDetailResponse> getTemplate(
            @PathVariable Long templateId
    ) {
        return ResponseEntity.ok(
                surveyTemplateService.getTemplate(templateId)
        );
    }

    // Şablondan yeni bir anket oluşturur
    @PostMapping("/{templateId}/surveys")
    public ResponseEntity<Long> createSurveyFromTemplate(
            @PathVariable Long templateId,
            @RequestBody CreateSurveyFromTemplateRequest request
    ) {
        Long surveyId =
                surveyTemplateService.createSurveyFromTemplate(
                        templateId,
                        request
                );

        return ResponseEntity
                .created(
                        URI.create("/admin/surveys/" + surveyId)
                )
                .body(surveyId);
    }

    // Şablonu siler
    @DeleteMapping("/{templateId}")
    public ResponseEntity<Void> deleteTemplate(
            @PathVariable Long templateId
    ) {
        surveyTemplateService.deleteTemplate(templateId);

        return ResponseEntity.noContent().build();
    }
}