package com.example.demo.dao.projection;

import java.time.LocalDateTime;

public interface CompletionTimeProjection {

    LocalDateTime getStartedDateTime();
    LocalDateTime getRespondedDateTime();
}
