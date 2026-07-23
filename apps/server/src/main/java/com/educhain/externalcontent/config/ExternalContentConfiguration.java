package com.educhain.externalcontent.config;

import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ExternalContentConfiguration {
    @Bean
    HttpClient externalContentHttpClient() {
        return HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(4))
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
    }
}
