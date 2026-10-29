package vn.edu.uth.scentstation.iot;

/**
 * The six MQTT topics of Report section 2.8.3. These names are a contract
 * between the backend and the device, so they live in one constant each and
 * are never typed out anywhere else.
 *
 * <p><strong>Duplicated in the simulator project; the two copies must stay
 * identical.</strong>
 *
 * <p>Why {@code ack} and {@code result} are separate topics, which is the
 * question most worth being able to answer: an acknowledgement proves the
 * device received and accepted the command. It does not prove the spray
 * happened. If the two were one message, the backend would have to guess
 * whenever the link dropped in between, and a guess is sometimes "charged the
 * customer and did not spray" and sometimes "sprayed twice". Keeping them
 * apart lets the backend tell three outcomes apart — succeeded, failed, and
 * not known — and that third one is the UNCERTAIN state of NFR4.5.
 */
public final class Topics {

    public static final String PREFIX = "scentstation/kiosk/";

    /** Device to backend: still alive (FR5.1). */
    public static final String HEARTBEAT = "heartbeat";

    /** Device to backend: sensor readings (FR5.3). */
    public static final String TELEMETRY = "telemetry";

    /** Device to backend: discrete events such as a door opening (FR5.4). */
    public static final String EVENT = "event";

    /** Backend to device: a signed instruction to spray once (FR4.2). */
    public static final String COMMAND = "command";

    /** Device to backend: command received and accepted, or refused (FR4.5). */
    public static final String ACK = "ack";

    /** Device to backend: what actually happened (FR4.9). */
    public static final String RESULT = "result";

    private Topics() {
    }

    public static String forDevice(String deviceId, String leaf) {
        return PREFIX + deviceId + "/" + leaf;
    }

    /** Subscription pattern covering one leaf for every device. */
    public static String wildcard(String leaf) {
        return PREFIX + "+/" + leaf;
    }

    /**
     * The device id out of a full topic, or null when the topic does not have
     * the expected shape.
     */
    public static String deviceIdOf(String topic) {
        if (topic == null || !topic.startsWith(PREFIX)) {
            return null;
        }
        String rest = topic.substring(PREFIX.length());
        int slash = rest.indexOf('/');
        return slash <= 0 ? null : rest.substring(0, slash);
    }

    /** The last segment of a topic: heartbeat, telemetry, event, ack or result. */
    public static String leafOf(String topic) {
        if (topic == null) {
            return null;
        }
        int slash = topic.lastIndexOf('/');
        return slash < 0 ? null : topic.substring(slash + 1);
    }
}
