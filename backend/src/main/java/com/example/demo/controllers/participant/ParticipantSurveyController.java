package com.example.demo.controllers.participant;

import com.example.demo.dto.ParticipantSurveyResponse;
import com.example.demo.dto.SubmitSurveyRequest;
import com.example.demo.service.ParticipantSurveyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Katılımcı uç noktaları. Hesap gerektirmez; davet tokenı X-Survey-Token başlığında gönderilir
 * (URL'de değil, böylece sunucu/proxy erişim loglarına düşmez).
 */
@RestController
@RequestMapping("/user/surveys")
@RequiredArgsConstructor
public class ParticipantSurveyController {

    public static final String TOKEN_HEADER = "X-Survey-Token";

    private final ParticipantSurveyService participantSurveyService;

    @GetMapping("/{surveyId}")
    public ResponseEntity<ParticipantSurveyResponse> getSurvey(
            @PathVariable Long surveyId,
            @RequestHeader(value = TOKEN_HEADER, required = false) String token
    ) {
        return ResponseEntity.ok(participantSurveyService.getSurvey(surveyId, token));
    }

    /** Ara kayıt: gövde istemcinin yanıt taslağıdır (JSON nesnesi), GET cevabında draftAnswers olarak geri döner. */
    @PutMapping(value = "/{surveyId}/draft", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> saveDraft(
            @PathVariable Long surveyId,
            @RequestHeader(value = TOKEN_HEADER, required = false) String token,
            @RequestBody String draftJson
    ) {
        participantSurveyService.saveDraft(surveyId, token, draftJson);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{surveyId}/responses")
    public ResponseEntity<Void> submit(
            @PathVariable Long surveyId,
            @RequestHeader(value = TOKEN_HEADER, required = false) String token,
            @RequestBody SubmitSurveyRequest request
    ) {
        participantSurveyService.submit(surveyId, token, request);
        return ResponseEntity.noContent().build();
    }
}
