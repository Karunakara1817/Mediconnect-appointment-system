package com.mediconnect.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient notificationRestClient(
            @Value("${app.notification.url:http://localhost:5000}") String notificationServiceUrl
    ) {
        return RestClient.builder()
                .baseUrl(notificationServiceUrl)
                .build();
    }
}