package com.example.demo.service;

import com.example.demo.dao.entity.Survey;

import java.util.List;

public interface MailService {

    void sendSimpleMail(List<String> toList, String subject, String text, Survey survey);
}
