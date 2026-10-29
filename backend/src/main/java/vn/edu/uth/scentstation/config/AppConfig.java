package vn.edu.uth.scentstation.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/** Application-wide beans that are not tied to one business area. */
@Configuration
@EnableConfigurationProperties(ScentStationProperties.class)
public class AppConfig {

    /**
     * One clock, injected everywhere instead of calling {@code Instant.now()}
     * directly. Unit tests swap in a fixed clock so order expiry and the
     * dispensing timeout can be checked without sleeping.
     */
    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
