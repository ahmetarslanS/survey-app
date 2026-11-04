package com.example.demo.util;

import com.example.demo.dao.entity.QuestionType;
import com.example.demo.dto.OptionReportResponse;
import com.example.demo.dto.QuestionReportResponse;
import com.example.demo.dto.SurveyReportResponse;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.UncheckedIOException;
import java.io.Writer;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Writes a survey report as CSV in the format Excel with Turkish locale expects:
 * UTF-8 with BOM, ";" as delimiter and "," as decimal separator.
 */
@Component
public class SurveyReportCsvWriter {

    private static final char UTF8_BOM = '﻿';
    private static final String EMPTY_VALUE = "-";
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private static final CSVFormat CSV_FORMAT = CSVFormat.DEFAULT.builder()
            .setDelimiter(';')
            .setRecordSeparator("\r\n")
            .build();

    public byte[] write(SurveyReportResponse report) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        try (Writer writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);
             CSVPrinter printer = new CSVPrinter(writer, CSV_FORMAT)) {
            // BOM is required for Excel to read Turkish characters correctly.
            writer.write(UTF8_BOM);

            writeSummary(printer, report);
            printer.println();
            writeQuestionReports(printer, report);
            writeFreeTextAnswers(printer, report);
        } catch (IOException e) {
            throw new UncheckedIOException("Anket raporu CSV olarak oluşturulamadı.", e);
        }

        return outputStream.toByteArray();
    }

    private void writeSummary(CSVPrinter printer, SurveyReportResponse report) throws IOException {
        printer.printRecord("Anket Raporu");
        printer.printRecord("Anket", safeText(report.getTitle()));
        printer.printRecord("Açıklama", safeText(report.getDescription()));
        printer.printRecord("Durum", valueOrEmpty(report.getStatusDescription()));
        printer.printRecord("Bitiş Tarihi", formatDateTime(report.getEndDate()));
        printer.printRecord("Anonim", Boolean.TRUE.equals(report.getIsAnonymous()) ? "Evet" : "Hayır");
        printer.printRecord("Davet Edilen", report.getParticipantCount());
        printer.printRecord("Yanıtlayan", report.getResponseCount());
        printer.printRecord("Katılım Oranı (%)", formatDecimal(report.getParticipationRate()));
        printer.printRecord("Ortalama Tamamlama Süresi", valueOrEmpty(report.getAverageCompletionTimeText()));
        printer.printRecord("Memnuniyet Ortalaması (1-5)", formatDecimal(report.getSatisfactionAverage()));
        printer.printRecord("Rapor Tarihi", formatDateTime(LocalDateTime.now()));
    }

    private void writeQuestionReports(CSVPrinter printer, SurveyReportResponse report) throws IOException {
        printer.printRecord("Soru No", "Soru", "Tip", "Zorunlu", "Cevaplayan", "Cevaplanma Oranı (%)",
                "Ortalama Puan", "Seçenek", "Seçilme Sayısı", "Seçilme Oranı (%)");

        for (QuestionReportResponse question : report.getQuestionReports()) {
            if (question.getOptions().isEmpty()) {
                // FREETEXT questions have no options, their answers are listed in a separate section.
                printQuestionRow(printer, question, EMPTY_VALUE, EMPTY_VALUE, EMPTY_VALUE);
                continue;
            }
            for (OptionReportResponse option : question.getOptions()) {
                printQuestionRow(printer, question,
                        safeText(option.getText()),
                        String.valueOf(option.getSelectedCount()),
                        formatDecimal(option.getSelectedRate()));
            }
        }
    }

    private void printQuestionRow(CSVPrinter printer, QuestionReportResponse question,
                                  String optionText, String selectedCount, String selectedRate) throws IOException {
        printer.printRecord(
                question.getQuestionOrder(),
                safeText(question.getQuestionText()),
                question.getType() != null ? question.getType().getDescription() : EMPTY_VALUE,
                Boolean.TRUE.equals(question.getIsOptional()) ? "Hayır" : "Evet",
                question.getAnsweredCount(),
                formatDecimal(question.getAnsweredRate()),
                formatDecimal(question.getAverageScore()),
                optionText,
                selectedCount,
                selectedRate
        );
    }

    private void writeFreeTextAnswers(CSVPrinter printer, SurveyReportResponse report) throws IOException {
        boolean hasFreeTextQuestion = report.getQuestionReports().stream()
                .anyMatch(question -> question.getType() == QuestionType.FREETEXT);
        if (!hasFreeTextQuestion) {
            return;
        }

        printer.println();
        printer.printRecord("Serbest Metin Cevaplar");
        printer.printRecord("Soru No", "Soru", "Cevap");
        for (QuestionReportResponse question : report.getQuestionReports()) {
            if (question.getType() != QuestionType.FREETEXT) {
                continue;
            }
            for (String answer : question.getFreeTextAnswers()) {
                printer.printRecord(question.getQuestionOrder(), safeText(question.getQuestionText()), safeText(answer));
            }
        }
    }

    // Values starting with these characters are run as formulas by Excel (CSV injection),
    // so texts entered by users are prefixed with an apostrophe.
    private String safeText(String value) {
        if (value == null || value.isEmpty()) {
            return EMPTY_VALUE;
        }
        char firstChar = value.charAt(0);
        if (firstChar == '=' || firstChar == '+' || firstChar == '-' || firstChar == '@'
                || firstChar == '\t' || firstChar == '\r') {
            return "'" + value;
        }
        return value;
    }

    private String valueOrEmpty(String value) {
        return value != null ? value : EMPTY_VALUE;
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(DATE_TIME_FORMATTER) : EMPTY_VALUE;
    }

    // e.g. 66.67 -> "66,67"
    private String formatDecimal(BigDecimal value) {
        if (value == null) {
            return EMPTY_VALUE;
        }
        DecimalFormat decimalFormat = new DecimalFormat("0.00", DecimalFormatSymbols.getInstance(Locale.of("tr", "TR")));
        return decimalFormat.format(value);
    }
}
