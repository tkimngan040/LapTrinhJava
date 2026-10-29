package vn.edu.uth.scentstation.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Every tunable value of the application, bound from the {@code scentstation}
 * block of application.yml. Nothing in the code reads a magic number directly.
 */
@ConfigurationProperties(prefix = "scentstation")
public class ScentStationProperties {

    private Security security = new Security();
    private Order order = new Order();
    private Payment payment = new Payment();
    private Dispensing dispensing = new Dispensing();
    private Mqtt mqtt = new Mqtt();

    public Security getSecurity() {
        return security;
    }

    public void setSecurity(Security security) {
        this.security = security;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public Payment getPayment() {
        return payment;
    }

    public void setPayment(Payment payment) {
        this.payment = payment;
    }

    public Dispensing getDispensing() {
        return dispensing;
    }

    public void setDispensing(Dispensing dispensing) {
        this.dispensing = dispensing;
    }

    public Mqtt getMqtt() {
        return mqtt;
    }

    public void setMqtt(Mqtt mqtt) {
        this.mqtt = mqtt;
    }

    public static class Security {
        private String jwtSecret;
        private long jwtTtlMinutes = 480;

        public String getJwtSecret() {
            return jwtSecret;
        }

        public void setJwtSecret(String jwtSecret) {
            this.jwtSecret = jwtSecret;
        }

        public long getJwtTtlMinutes() {
            return jwtTtlMinutes;
        }

        public void setJwtTtlMinutes(long jwtTtlMinutes) {
            this.jwtTtlMinutes = jwtTtlMinutes;
        }
    }

    public static class Order {
        private long ttlSeconds = 180;

        public long getTtlSeconds() {
            return ttlSeconds;
        }

        public void setTtlSeconds(long ttlSeconds) {
            this.ttlSeconds = ttlSeconds;
        }
    }

    public static class Payment {
        private String webhookSecret;

        public String getWebhookSecret() {
            return webhookSecret;
        }

        public void setWebhookSecret(String webhookSecret) {
            this.webhookSecret = webhookSecret;
        }
    }

    public static class Dispensing {
        private long commandTtlSeconds = 30;
        private long resultTimeoutSeconds = 60;

        public long getCommandTtlSeconds() {
            return commandTtlSeconds;
        }

        public void setCommandTtlSeconds(long commandTtlSeconds) {
            this.commandTtlSeconds = commandTtlSeconds;
        }

        public long getResultTimeoutSeconds() {
            return resultTimeoutSeconds;
        }

        public void setResultTimeoutSeconds(long resultTimeoutSeconds) {
            this.resultTimeoutSeconds = resultTimeoutSeconds;
        }
    }

    public static class Mqtt {
        private String brokerUrl = "tcp://localhost:1883";
        private String clientId = "scentstation-backend";
        private String commandSecret;
        private long heartbeatTimeoutSeconds = 45;

        public String getBrokerUrl() {
            return brokerUrl;
        }

        public void setBrokerUrl(String brokerUrl) {
            this.brokerUrl = brokerUrl;
        }

        public String getClientId() {
            return clientId;
        }

        public void setClientId(String clientId) {
            this.clientId = clientId;
        }

        public String getCommandSecret() {
            return commandSecret;
        }

        public void setCommandSecret(String commandSecret) {
            this.commandSecret = commandSecret;
        }

        public long getHeartbeatTimeoutSeconds() {
            return heartbeatTimeoutSeconds;
        }

        public void setHeartbeatTimeoutSeconds(long heartbeatTimeoutSeconds) {
            this.heartbeatTimeoutSeconds = heartbeatTimeoutSeconds;
        }
    }
}
