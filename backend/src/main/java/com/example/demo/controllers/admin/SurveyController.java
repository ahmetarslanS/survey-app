package com.example.demo.controllers.admin;

import com.example.demo.dao.entity.Survey;
import com.example.demo.dto.AdminSurveyListResponse;
import com.example.demo.dto.CreateSurveyRequest;
import com.example.demo.dto.SendSurveyResponse;
import com.example.demo.dto.SurveyDetailResponse;
import com.example.demo.dto.SurveyReportResponse;
import com.example.demo.dto.SurveyUpdateResponse;
import com.example.demo.dto.UpdateSurveyRequest;
import com.example.demo.service.SurveyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class SurveyController {

    private final SurveyService surveyService;

    @PostMapping(value = "/surveys", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createSurvey(
            @RequestBody CreateSurveyRequest request
    ) {
        Survey surveyEntity = surveyService.createSurvey(request);
        return ResponseEntity.ok(surveyEntity.getId());
    }

    // Same as createSurvey, participants can additionally be uploaded as a CSV file.
    @PostMapping(value = "/surveys", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createSurveyWithParticipantFile(
            @RequestPart("request") CreateSurveyRequest request,
            @RequestPart(value = "participantFile", required = false) MultipartFile participantFile
    ) {
        Survey surveyEntity = surveyService.createSurvey(request, participantFile);
        return ResponseEntity.ok(surveyEntity.getId());
    }

    @GetMapping("/surveys")
    public ResponseEntity<List<AdminSurveyListResponse>> getAllSurveys() {
        return ResponseEntity.ok(surveyService.getAllSurveys());
    }

    // ---- Taslaklar: kaydet -> (düzenle) -> gönder ----

    /** Anketi DRAFT olarak kaydeder, mail göndermez. Dönen değer: surveyId */
    @PostMapping("/surveys/drafts")
    public ResponseEntity<Long> createDraft(@RequestBody CreateSurveyRequest request) {
        Long surveyId = surveyService.createDraft(request);
        return ResponseEntity.created(URI.create("/admin/surveys/" + surveyId)).body(surveyId);
    }

    /** Taslağın tüm içeriğini günceller (yalnızca DRAFT). */
    @PutMapping("/surveys/{surveyId}/draft")
    public ResponseEntity<Long> updateDraft(
            @PathVariable Long surveyId,
            @RequestBody CreateSurveyRequest request
    ) {
        return ResponseEntity.ok(surveyService.updateDraft(surveyId, request));
    }

    @GetMapping("/surveys/{surveyId}")
    public ResponseEntity<SurveyDetailResponse> getSurvey(@PathVariable Long surveyId) {
        return ResponseEntity.ok(surveyService.getSurvey(surveyId));
    }

    /** Taslağı yayına alır ve davet maillerini gönderir. */
    @PostMapping("/surveys/{surveyId}/send")
    public ResponseEntity<SendSurveyResponse> sendSurvey(@PathVariable Long surveyId) {
        return ResponseEntity.ok(surveyService.sendSurvey(surveyId));
    }

    /** Yalnızca taslak anketler silinebilir. */
    @DeleteMapping("/surveys/{surveyId}")
    public ResponseEntity<Void> deleteDraft(@PathVariable Long surveyId) {
        surveyService.deleteDraft(surveyId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/surveys/{surveyId}")
    public ResponseEntity<SurveyUpdateResponse> updateSurvey(
            @PathVariable Long surveyId,
            @RequestBody UpdateSurveyRequest request
    ) {
        SurveyUpdateResponse response =
                surveyService.updateSurvey(surveyId, request);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/surveys/{surveyId}/reports")
    public ResponseEntity<SurveyReportResponse> getSurveyReport(
            @PathVariable Long surveyId
    ) {
        return ResponseEntity.ok(surveyService.getSurveyReport(surveyId));
    }

    @GetMapping("/surveys/{surveyId}/export/csv")
    public ResponseEntity<byte[]> exportSurveyReportAsCsv(
            @PathVariable Long surveyId
    ) {
        byte[] content = surveyService.exportSurveyReportAsCsv(surveyId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(buildReportFileName(surveyId, "csv"))
                        .build()
                        .toString())
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .contentLength(content.length)
                .body(content);
    }

    // e.g. anket-raporu-1-20261103-1530.csv
    private String buildReportFileName(Long surveyId, String extension) {
        return "anket-raporu-" + surveyId + "-"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmm"))
                + "." + extension;
    }
}