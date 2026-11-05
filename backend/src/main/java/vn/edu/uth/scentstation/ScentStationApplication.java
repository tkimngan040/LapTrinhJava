package vn.edu.uth.scentstation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

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
        // The PostgreSQL JDBC driver sends the machine's own time zone in its
        // start-up packet, and PostgreSQL refuses a name its tzdata does not
        // carry. Every machine in this team reports Asia/Saigon, which the
        // postgres:16 image does not accept, so the application would not
        // start at all: "FATAL: invalid value for parameter TimeZone".
        //
        // The schema stores every instant in UTC already
        // (hibernate.jdbc.time_zone in application.yml), so the fix is to say
        // so once here, before Spring builds the data source. Doing it in main
        // rather than as a launch flag means it holds for mvn spring-boot:run,
        // for java -jar and for a test alike, and nobody has to remember it.
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));

        SpringApplication.run(ScentStationApplication.class, args);
    }
}
