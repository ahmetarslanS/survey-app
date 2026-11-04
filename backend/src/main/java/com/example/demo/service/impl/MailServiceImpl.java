package com.example.demo.service.impl;

import com.example.demo.dao.entity.Survey;
import com.example.demo.service.MailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.util.CollectionUtils;

import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailServiceImpl implements MailService {
    private final JavaMailSender mailSender;

    @Override
    public void sendSimpleMail(List<String> toList, String subject, String text, Survey survey) {
        if (CollectionUtils.isEmpty(toList)) {
            log.warn("Mail recipient list is empty, mail not sent. surveyId: {}", survey.getId());
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toList.toArray(String[]::new));
            helper.setSubject(subject);
            helper.setText(buildMailContent(text, survey), true);

            mailSender.send(message);
            log.info("HTML mail sent to: {}", toList);
        } catch (MessagingException e) {
            log.error("Failed to send HTML mail to: {}", toList, e);
            throw new RuntimeException("Mail gönderilemedi", e);
        }

    }

    private @Nullable String buildMailContent(String text, Survey survey) {

        String mailContent = "<!DOCTYPE html>\n"
                + "<html lang=\"tr\">\n"
                + "<head>\n"
                + "    <meta charset=\"UTF-8\">\n"
                + "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"
                + "    <title>Anket Daveti</title>\n"
                + "</head>\n"
                + "<body style=\"margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8;\">\n"
                + "    <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #f0f4f8; padding: 40px 20px;\">\n"
                + "        <tr>\n"
                + "            <td align=\"center\">\n"
                + "                <table role=\"presentation\" width=\"600\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); overflow: hidden;\">\n"
                + "                    \n"
                + "                    <!-- Header -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 40px 30px 40px; text-align: center;\">\n"
                + "                            <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">\n"
                + "                                <tr>\n"
                + "                                    <td align=\"center\">\n"
                + "                                        <div style=\"width: 70px; height: 70px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; display: inline-block; line-height: 70px;\">\n"
                + "                                            <span style=\"font-size: 32px;\">\uD83D\uDCCB</span>\n"
                + "                                        </div>\n"
                + "                                    </td>\n"
                + "                                </tr>\n"
                + "                                <tr>\n"
                + "                                    <td align=\"center\" style=\"padding-top: 20px;\">\n"
                + "                                        <h1 style=\"margin: 0; color: #ffffff; font-size: 26px; font-weight: 600; letter-spacing: -0.5px;\">\n"
                + "                                            Anket Daveti\n"
                + "                                        </h1>\n"
                + "                                    </td>\n"
                + "                                </tr>\n"
                + "                            </table>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "\n"
                + "                    <!-- Body -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"padding: 40px;\">\n"
                + "                            <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">\n"
                + "                                <tr>\n"
                + "                                    <td>\n"
                + "                                        <p style=\"margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;\">\n"
                + "                                            Sayın Yetkili,\n"
                + "                                        </p>\n"
                + "                                        <p style=\"margin: 0 0 25px 0; color: #4b5563; font-size: 15px; line-height: 1.7;\">\n"
                + "                                            Değerli görüşlerinizi almak amacıyla tarafınıza bir anket gönderilmiştir. \n"
                + "                                            Katılımınız bizim için büyük önem taşımaktadır.\n"
                + "                                        </p>\n"
                + "                                    </td>\n"
                + "                                </tr>\n"
                + "\n"
                + "                                <!-- Survey Info Box -->\n"
                + "                                <tr>\n"
                + "                                    <td style=\"padding: 25px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; margin: 20px 0;\">\n"
                + "                                        <h2 style=\"margin: 0 0 12px 0; color: #1e3a8a; font-size: 18px; font-weight: 600;\">\n"
                + "                                            {{SURVEY_TITLE}}\n"
                + "                                        </h2>\n"
                + "                                        <p style=\"margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;\">\n"
                + "                                            {{SURVEY_DESCRIPTION}}\n"
                + "                                        </p>\n"
                + "                                    </td>\n"
                + "                                </tr>\n"
                + "\n"
                + "                                <tr>\n"
                + "                                    <td style=\"padding-top: 30px;\">\n"
                + "                                        <p style=\"margin: 0 0 25px 0; color: #4b5563; font-size: 15px; line-height: 1.7;\">\n"
                + "                                            Anketi tamamlamak için aşağıdaki bağlantıya tıklayabilirsiniz. \n"
                + "                                            Yanıtlarınız gizli tutulacak ve yalnızca istatistiksel amaçlarla değerlendirilecektir.\n"
                + "                                        </p>\n"
                + "                                    </td>\n"
                + "                                </tr>\n"
                + "\n"
                + "                                <!-- CTA Button -->\n"
                + "                                <tr>\n"
                + "                                    <td align=\"center\" style=\"padding: 10px 0 30px 0;\">\n"
                + "                                        <a href=\"{{SURVEY_LINK}}\" \n"
                + "                                           target=\"_blank\"\n"
                + "                                           style=\"display: inline-block; \n"
                + "                                                  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); \n"
                + "                                                  color: #000; \n"
                + "                                                  text-decoration: none; \n"
                + "                                                  padding: 16px 40px; \n"
                + "                                                  font-size: 16px; \n"
                + "                                                  font-weight: 600; \n"
                + "                                                  border-radius: 8px;\n"
                + "                                                  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);\n"
                + "                                                  transition: all 0.3s ease;\">\n"
                + "                                            Ankete Katıl\n"
                + "                                        </a>\n"
                + "                                    </td>\n"
                + "                                </tr>\n"
                + "\n"
                + "                                <!-- Alternative Link -->\n"
                + "                                <tr>\n"
                + "                                    <td>\n"
                + "                                        <p style=\"margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6; text-align: center;\">\n"
                + "                                            Buton çalışmıyorsa aşağıdaki bağlantıyı tarayıcınıza kopyalayabilirsiniz:\n"
                + "                                        </p>\n"
                + "                                        <p style=\"margin: 8px 0 0 0; text-align: center;\">\n"
                + "                                            <a href=\"{{SURVEY_LINK}}\" \n"
                + "                                               style=\"color: #3b82f6; font-size: 13px; word-break: break-all;\">\n"
                + "                                                {{SURVEY_LINK}}\n"
                + "                                            </a>\n"
                + "                                        </p>\n"
                + "                                    </td>\n"
                + "                                </tr>\n"
                + "                            </table>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "\n"
                + "                    <!-- Divider -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"padding: 0 40px;\">\n"
                + "                            <hr style=\"border: none; border-top: 1px solid #e5e7eb; margin: 0;\">\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "\n"
                + "                    <!-- Footer -->\n"
                + "                    <tr>\n"
                + "                        <td style=\"padding: 30px 40px; background-color: #f8fafc;\">\n"
                + "                            <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">\n"
                + "                                <tr>\n"
                + "                                    <td align=\"center\">\n"
                + "                                        <p style=\"margin: 0 0 8px 0; color: #6b7280; font-size: 14px;\">\n"
                + "                                            Katılımınız için teşekkür ederiz.\n"
                + "                                        </p>\n"
                + "                                        <p style=\"margin: 0; color: #9ca3af; font-size: 12px;\">\n"
                + "                                            Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.\n"
                + "                                        </p>\n"
                + "                                    </td>\n"
                + "                                </tr>\n"
                + "                                <tr>\n"
                + "                                    <td align=\"center\" style=\"padding-top: 20px;\">\n"
                + "                                        <p style=\"margin: 0; color: #1e3a8a; font-size: 14px; font-weight: 600;\">\n"
                + "                                            DFX Survey\n"
                + "                                        </p>\n"
                + "                                        <p style=\"margin: 4px 0 0 0; color: #9ca3af; font-size: 12px;\">\n"
                + "                                            © 2025 Tüm hakları saklıdır.\n"
                + "                                        </p>\n"
                + "                                    </td>\n"
                + "                                </tr>\n"
                + "                            </table>\n"
                + "                        </td>\n"
                + "                    </tr>\n"
                + "\n"
                + "                </table>\n"
                + "            </td>\n"
                + "        </tr>\n"
                + "    </table>\n"
                + "</body>\n"
                + "</html>";

        return mailContent.replace("{{SURVEY_TITLE}}", Objects.toString(survey.getTitle(), ""))
                .replace("{{SURVEY_DESCRIPTION}}", Objects.toString(survey.getDescription(), ""))
                .replace("{{SURVEY_LINK}}",
                        "http://localhost:8080/user/api/v1/surveys/detail/" + survey.getId());

    }
}
