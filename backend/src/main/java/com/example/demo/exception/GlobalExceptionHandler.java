package com.example.demo.exception;

import com.example.demo.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(SurveyNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleSurveyNotFound(
            SurveyNotFoundException e,
            HttpServletRequest request
    ) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, e.getMessage(), request);
    }

    @ExceptionHandler(InvitationAccessException.class)
    public ResponseEntity<ErrorResponse> handleInvitationAccess(
            InvitationAccessException e,
            HttpServletRequest request
    ) {
        InvitationAccessException.Reason reason = e.getReason();
        return buildErrorResponse(reason.getStatus(), reason.getMessage(), request, reason.getCode());
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleRateLimit(
            RateLimitExceededException e,
            HttpServletRequest request
    ) {
        return buildErrorResponse(HttpStatus.TOO_MANY_REQUESTS, e.getMessage(), request, "RATE_LIMITED");
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(
            InvalidCredentialsException e,
            HttpServletRequest request
    ) {
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, e.getMessage(), request);
    }

    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ErrorResponse> handleAccountLocked(
            AccountLockedException e,
            HttpServletRequest request
    ) {
        return buildErrorResponse(HttpStatus.LOCKED, e.getMessage(), request);
    }

    // Token yok / geçersiz / süresi dolmuş (RestAuthenticationEntryPoint buraya devreder)
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(
            AuthenticationException e,
            HttpServletRequest request
    ) {
        return buildErrorResponse(HttpStatus.UNAUTHORIZED,
                "Oturumunuz geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapın.", request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException e,
            HttpServletRequest request
    ) {
        return buildErrorResponse(HttpStatus.FORBIDDEN, "Bu işlem için yetkiniz yok.", request);
    }

    @ExceptionHandler({
            InvalidSurveyStatusTransitionException.class,
            IllegalArgumentException.class
    })
    public ResponseEntity<ErrorResponse> handleBadRequest(
            RuntimeException e,
            HttpServletRequest request
    ) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage(), request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleNotReadable(
            HttpMessageNotReadableException e,
            HttpServletRequest request
    ) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST,
                "İstek gövdesi okunamadı. JSON formatını ve alan değerlerini kontrol ediniz.", request);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException e,
            HttpServletRequest request
    ) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST,
                "Geçersiz parametre değeri. " + e.getName() + ": " + e.getValue(), request);
    }

    private ResponseEntity<ErrorResponse> buildErrorResponse(
            HttpStatus status,
            String message,
            HttpServletRequest request
    ) {
        return buildErrorResponse(status, message, request, null);
    }

    private ResponseEntity<ErrorResponse> buildErrorResponse(
            HttpStatus status,
            String message,
            HttpServletRequest request,
            String code
    ) {
        // Query string loglanmaz: katılımcı linkindeki token loglara düşmemeli (NFR-43)
        log.warn("{} {} -> {} {}", request.getMethod(), request.getRequestURI(), status.value(), message);

        ErrorResponse errorResponse = new ErrorResponse(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                request.getRequestURI(),
                code
        );
        return ResponseEntity.status(status).body(errorResponse);
    }
}
