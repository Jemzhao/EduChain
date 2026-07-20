package com.educhain.evidence.config;

import java.net.http.HttpClient;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(EvidenceProperties.class)
public class EvidenceConfiguration {

    @Bean
    HttpClient evidenceHttpClient(EvidenceProperties properties) {
        return HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(properties.requestTimeout())
                .build();
    }
}
