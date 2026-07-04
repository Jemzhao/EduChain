package com.educhain.auth.config;

import com.educhain.auth.security.AccessTokenCodec;
import com.educhain.auth.service.TokenGenerator;
import java.time.Clock;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@EnableConfigurationProperties(AuthProperties.class)
public class AuthConfiguration {

    @Bean
    Clock applicationClock() {
        return Clock.systemUTC();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new Argon2PasswordEncoder(16, 32, 1, 65_536, 3);
    }

    @Bean
    TokenGenerator tokenGenerator() {
        return new TokenGenerator();
    }

    @Bean
    AccessTokenCodec accessTokenCodec(AuthProperties properties, Clock clock) {
        return new AccessTokenCodec(properties, clock);
    }
}
