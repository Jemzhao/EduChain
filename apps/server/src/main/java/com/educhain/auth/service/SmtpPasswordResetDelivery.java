package com.educhain.auth.service;

import com.educhain.auth.config.AuthProperties;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
        prefix = "educhain.auth",
        name = "password-reset-email-enabled",
        havingValue = "true"
)
public class SmtpPasswordResetDelivery implements PasswordResetDelivery {

    private final JavaMailSender mailSender;
    private final AuthProperties properties;

    public SmtpPasswordResetDelivery(JavaMailSender mailSender, AuthProperties properties) {
        this.mailSender = mailSender;
        this.properties = properties;
    }

    @Override
    public void send(String email, String rawToken) {
        String link = properties.passwordResetBaseUrl()
                + "?token="
                + URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(properties.passwordResetFrom());
        message.setTo(email);
        message.setSubject("EduChain password reset");
        message.setText("Use this one-time link to reset your password: " + link);
        mailSender.send(message);
    }
}
