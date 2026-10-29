package vn.edu.uth.scentstation.iot;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PreDestroy;
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallbackExtended;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.config.ScentStationProperties;

import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * The MQTT side of the IoT gateway: connects to the broker, publishes commands,
 * and hands every inbound message to {@link DeviceMessageHandler}.
 *
 * <p>It does no business work of its own. Report section 2.8.2 requires that
 * each business rule have exactly one implementation regardless of whether it
 * is reached from the web or from a device, so this class parses and routes,
 * and the services decide.
 *
 * <p>Quality of service 1 in both directions: a command that arrives twice is
 * safe because of the idempotency key, while a command that never arrives is
 * not safe at all.
 */
@Component
public class MqttDeviceGateway implements DeviceGateway, MqttCallbackExtended {

    private static final Logger log = LoggerFactory.getLogger(MqttDeviceGateway.class);
    private static final int QOS = 1;

    private final ScentStationProperties properties;
    private final ObjectProvider<DeviceMessageHandler> handlerProvider;
    private final ObjectMapper objectMapper;
    private MqttClient client;

    /**
     * The handler is injected lazily, through a provider, to break a genuine
     * dependency cycle: this gateway needs the handler to deliver inbound
     * messages, the handler needs {@code DispenseService} to act on them, and
     * {@code DispenseService} needs a {@link DeviceGateway} to publish
     * commands. Spring Boot refuses circular references at startup, and
     * resolving the handler on first use rather than at construction is the
     * smallest honest way out.
     */
    public MqttDeviceGateway(ScentStationProperties properties,
                             ObjectProvider<DeviceMessageHandler> handlerProvider,
                             ObjectMapper objectMapper) {
        this.properties = properties;
        this.handlerProvider = handlerProvider;
        this.objectMapper = objectMapper;
    }

    /**
     * Connects once the rest of the application is up.
     *
     * <p>A broker that is not running must not stop the backend from starting:
     * the web tier is still perfectly usable, and Paho reconnects on its own
     * when the broker appears.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void connect() {
        try {
            client = new MqttClient(properties.getMqtt().getBrokerUrl(),
                    properties.getMqtt().getClientId(), new MemoryPersistence());

            MqttConnectOptions options = new MqttConnectOptions();
            options.setAutomaticReconnect(true);
            options.setCleanSession(true);
            options.setConnectionTimeout(10);
            options.setKeepAliveInterval(30);

            client.setCallback(this);
            client.connect(options);
            log.info("Connected to the MQTT broker at {}", properties.getMqtt().getBrokerUrl());
        } catch (MqttException ex) {
            log.warn("Could not reach the MQTT broker at {}: {}. "
                            + "The web API still works; device messages will be handled once it connects.",
                    properties.getMqtt().getBrokerUrl(), ex.getMessage());
        }
    }

    /**
     * Subscriptions are made here rather than right after connect, so they are
     * restored automatically after a reconnect as well.
     */
    @Override
    public void connectComplete(boolean reconnect, String serverUri) {
        try {
            client.subscribe(Topics.wildcard(Topics.HEARTBEAT), QOS);
            client.subscribe(Topics.wildcard(Topics.TELEMETRY), QOS);
            client.subscribe(Topics.wildcard(Topics.EVENT), QOS);
            client.subscribe(Topics.wildcard(Topics.ACK), QOS);
            client.subscribe(Topics.wildcard(Topics.RESULT), QOS);
            log.info("Subscribed to the five inbound device topics ({})",
                    reconnect ? "after a reconnect" : "first connect");
        } catch (MqttException ex) {
            log.error("Could not subscribe to the device topics", ex);
        }
    }

    @Override
    public void publishCommand(String deviceId, Map<String, Object> payload) {
        String topic = Topics.forDevice(deviceId, Topics.COMMAND);
        try {
            byte[] body = objectMapper.writeValueAsBytes(payload);
            MqttMessage message = new MqttMessage(body);
            message.setQos(QOS);
            client.publish(topic, message);
            log.debug("Published a command to {}", topic);
        } catch (MqttException | com.fasterxml.jackson.core.JsonProcessingException ex) {
            log.error("Could not publish a command to {}", topic, ex);
            throw ApiException.conflict("DEVICE_UNREACHABLE",
                    "The command could not be sent to the machine");
        } catch (NullPointerException ex) {
            throw ApiException.conflict("DEVICE_UNREACHABLE",
                    "The MQTT broker is not connected");
        }
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        String deviceId = Topics.deviceIdOf(topic);
        String leaf = Topics.leafOf(topic);
        String body = new String(message.getPayload(), StandardCharsets.UTF_8);

        if (deviceId == null || leaf == null) {
            log.warn("Ignoring a message on an unexpected topic: {}", topic);
            return;
        }

        try {
            handlerProvider.getObject().handle(deviceId, leaf, body);
        } catch (RuntimeException ex) {
            // A bad message from one device must not take down the subscriber
            // for every other device.
            log.error("Failed to handle a {} message from {}: {}", leaf, deviceId, ex.getMessage());
        }
    }

    @Override
    public void connectionLost(Throwable cause) {
        log.warn("Lost the MQTT connection: {}. Paho will reconnect.", cause.getMessage());
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
        // Nothing to do: delivery is confirmed by the device's ack, not by the
        // broker accepting the publish.
    }

    @PreDestroy
    public void disconnect() {
        if (client != null && client.isConnected()) {
            try {
                client.disconnect();
            } catch (MqttException ex) {
                log.debug("Error while disconnecting from the broker", ex);
            }
        }
    }
}
