package com.example.demo.service;

import com.example.demo.dao.entity.Survey;

public interface MailService {

    /** Katılımcıya kişiye özel davet linkini içeren maili gönderir. */
    void sendInvitation(Survey survey, String recipient, String surveyLink);
}
