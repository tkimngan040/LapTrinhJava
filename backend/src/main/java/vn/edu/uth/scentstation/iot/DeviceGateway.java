package vn.edu.uth.scentstation.iot;

import java.util.Map;

/**
 * How the business layer reaches a device. One method, one direction: the
 * backend publishes commands and nothing else.
 *
 * <p>An interface rather than the MQTT client directly, so
 * {@code DispenseService} can be unit tested without a broker, and so the
 * transport could change without touching any business code.
 */
public interface DeviceGateway {

    /**
     * Publishes a signed command to one machine's command topic.
     *
     * @param deviceId the machine, which becomes part of the topic name
     * @param payload  the signed command, signature field included
     */
    void publishCommand(String deviceId, Map<String, Object> payload);
}
