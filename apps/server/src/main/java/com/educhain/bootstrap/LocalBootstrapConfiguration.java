package com.educhain.bootstrap;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(LocalBootstrapProperties.class)
public class LocalBootstrapConfiguration {
}
