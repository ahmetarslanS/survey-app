package com.example.demo.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Reads participant mails from a CSV file.
 * Expected format is one mail per row, an optional "email" header and "," or ";" as delimiter.
 * If the file has more than one column, the "email" column is used, otherwise the first column.
 */
@Slf4j
@Component
public class ParticipantCsvParser {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final String EMAIL_HEADER = "email";
    private static final char UTF8_BOM = '﻿';
    private static final int MAX_INVALID_ROWS_IN_MESSAGE = 10;

    public List<String> parse(MultipartFile file) {
        validateFile(file);

        String content = readContent(file);
        char delimiter = detectDelimiter(content);
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setDelimiter(delimiter)
                .setTrim(true)
                .setIgnoreEmptyLines(true)
                .build();

        Set<String> mailSet = new LinkedHashSet<>();
        List<String> invalidRowList = new ArrayList<>();

        try (CSVParser parser = format.parse(new StringReader(content))) {
            int emailColumnIndex = 0;
            boolean isFirstRecord = true;

            for (CSVRecord record : parser) {
                if (isFirstRecord) {
                    isFirstRecord = false;
                    int headerIndex = findEmailHeaderIndex(record);
                    if (headerIndex >= 0) {
                        emailColumnIndex = headerIndex;
                        continue;
                    }
                }

                String mail = record.size() > emailColumnIndex ? record.get(emailColumnIndex).trim() : "";
                if (mail.isEmpty()) {
                    continue;
                }
                if (!EMAIL_PATTERN.matcher(mail).matches()) {
                    invalidRowList.add("Satır " + parser.getCurrentLineNumber() + ": " + mail);
                    continue;
                }
                mailSet.add(mail.toLowerCase());
            }
        } catch (IOException | IllegalStateException e) {
            log.warn("Participant CSV could not be parsed. fileName: {}", file.getOriginalFilename(), e);
            throw new IllegalArgumentException("Katılımcı CSV dosyası okunamadı. Dosya formatını kontrol ediniz.");
        }

        if (!invalidRowList.isEmpty()) {
            throw new IllegalArgumentException(buildInvalidRowMessage(invalidRowList));
        }
        if (mailSet.isEmpty()) {
            throw new IllegalArgumentException("Katılımcı CSV dosyasında mail adresi bulunamadı.");
        }

        log.info("Participant CSV parsed. fileName: {}, mailCount: {}", file.getOriginalFilename(), mailSet.size());
        return new ArrayList<>(mailSet);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Katılımcı CSV dosyası boş olamaz.");
        }
        String fileName = file.getOriginalFilename();
        if (fileName == null || !fileName.toLowerCase().endsWith(".csv")) {
            throw new IllegalArgumentException("Katılımcı dosyası .csv uzantılı olmalıdır.");
        }
    }

    private String readContent(MultipartFile file) {
        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            // Excel adds a BOM to UTF-8 CSV files, it would otherwise be part of the first value.
            return !content.isEmpty() && content.charAt(0) == UTF8_BOM ? content.substring(1) : content;
        } catch (IOException e) {
            throw new IllegalArgumentException("Katılımcı CSV dosyası okunamadı.");
        }
    }

    // Excel with Turkish locale saves CSV files with ";", other tools mostly use ",".
    private char detectDelimiter(String content) {
        int lineEnd = content.indexOf('\n');
        String firstLine = lineEnd >= 0 ? content.substring(0, lineEnd) : content;
        return firstLine.contains(";") ? ';' : ',';
    }

    private int findEmailHeaderIndex(CSVRecord record) {
        for (int i = 0; i < record.size(); i++) {
            String value = record.get(i).trim().toLowerCase();
            if (EMAIL_HEADER.equals(value) || "e-mail".equals(value) || "mail".equals(value)) {
                return i;
            }
        }
        return -1;
    }

    private String buildInvalidRowMessage(List<String> invalidRowList) {
        String rows = String.join(", ", invalidRowList.subList(0, Math.min(invalidRowList.size(), MAX_INVALID_ROWS_IN_MESSAGE)));
        String moreText = invalidRowList.size() > MAX_INVALID_ROWS_IN_MESSAGE
                ? " ve " + (invalidRowList.size() - MAX_INVALID_ROWS_IN_MESSAGE) + " satır daha"
                : "";
        return "Katılımcı CSV dosyasında geçersiz mail adresleri var. " + rows + moreText;
    }
}
