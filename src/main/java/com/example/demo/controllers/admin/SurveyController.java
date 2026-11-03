package com.example.demo.controllers.admin;

import com.example.demo.dao.entity.Survey;
import com.example.demo.dto.AdminSurveyListResponse;
import com.example.demo.dto.CreateSurveyRequest;
import com.example.demo.dto.SurveyReportResponse;
import com.example.demo.dto.SurveyUpdateResponse;
import com.example.demo.dto.UpdateSurveyRequest;
import com.example.demo.service.SurveyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
}