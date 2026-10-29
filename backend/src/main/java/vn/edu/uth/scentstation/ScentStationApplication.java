package vn.edu.uth.scentstation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point of the ScentStation backend.
 *
 * <p>The backend is the only component that writes to the database and the only
 * one authorised to confirm a payment or emit a dispensing command
 * (Report section 2.8.1).
 */
@SpringBootApplication
@EnableScheduling
public class ScentStationApplication {

    public static void main(String[] args) {
        SpringApplication.run(ScentStationApplication.class, args);
    }
}
