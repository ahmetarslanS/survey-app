package com.example.demo.exception;

import com.example.demo.dao.entity.Status;

public class InvalidSurveyStatusTransitionException
        extends RuntimeException {

    public InvalidSurveyStatusTransitionException(
            Status currentStatus,
            Status targetStatus
    ) {
        super(
                currentStatus
                        + " statüsünden "
                        + targetStatus
                        + " statüsüne geçilemez."
        );
    }
}