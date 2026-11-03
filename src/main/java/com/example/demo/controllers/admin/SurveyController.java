package com.example.demo.controllers.admin;

import com.example.demo.dao.entity.Survey;
import com.example.demo.dto.CreateSurveyRequest;
import com.example.demo.dto.SurveyStatusResponse;
import com.example.demo.dto.UpdateSurveyStatusRequest;
import com.example.demo.service.SurveyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class SurveyController {

    private final SurveyService surveyService;

    @PostMapping
    public ResponseEntity<?> createSurvey(
            @RequestBody CreateSurveyRequest request
    ) {
        Survey surveyEntity = surveyService.createSurvey(request);
        return ResponseEntity.ok(surveyEntity.getId());
    }

    @PatchMapping("/{surveyId}/status")
    public ResponseEntity<SurveyStatusResponse> updateStatus(
            @PathVariable Long surveyId,
            @RequestBody UpdateSurveyStatusRequest request
    ) {
        SurveyStatusResponse response =
                surveyService.updateStatus(surveyId, request);

        return ResponseEntity.ok(response);
    }
}