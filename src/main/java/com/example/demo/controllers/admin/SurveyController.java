package com.example.demo.controllers.admin;

import com.example.demo.dao.entity.Survey;
import com.example.demo.dto.AdminSurveyListResponse;
import com.example.demo.dto.CreateSurveyRequest;
import com.example.demo.dto.SurveyReportResponse;
import com.example.demo.dto.SurveyUpdateResponse;
import com.example.demo.dto.UpdateSurveyRequest;
import com.example.demo.service.SurveyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class SurveyController {

    private final SurveyService surveyService;

    @PostMapping("/surveys")
    public ResponseEntity<?> createSurvey(
            @RequestBody CreateSurveyRequest request
    ) {
        Survey surveyEntity = surveyService.createSurvey(request);
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