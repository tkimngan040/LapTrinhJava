package vn.edu.uth.scentstation.simulator;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

/**
 * The four checks a device runs before it actuates anything, in the order
 * Report section 2.9.3 step 8 gives them.
 *
 * <ol>
 *   <li>the HMAC signature — a command that cannot be authenticated is refused
 *       and never actuated (BR7);</li>
 *   <li>the device id — a command addressed elsewhere is refused, so one
 *       machine can never spray on another's behalf (FR4.6);</li>
 *   <li>expiry and the idempotency key — a stale or already-seen command is
 *       refused, which is what stops a replayed command from spraying twice
 *       (BR7, NFR3.4);</li>
 *   <li>the safety interlocks — door, maintenance mode, slot volume, critical
 *       error (BR8, FR4.7).</li>
 * </ol>
 *
 * <p>The order is not arbitrary. Authenticity comes first because an unsigned
 * command's own fields cannot be trusted to answer any of the later questions.
 *
 * <p>Deliberately free of MQTT and JSON libraries: it takes a map and returns a
 * verdict, so it can be unit tested with nothing but a JDK.
 */
public class CommandVerifier {

    /** What the device decided, and why. */
    public record Verdict(boolean accepted, String reason) {

        public static Verdict accept() {
            return new Verdict(true, null);
        }

        public static Verdict refuse(String reason) {
            return new Verdict(false, reason);
        }
    }

    private final String deviceId;
    private final CommandSigner signer;
    private final SafetyInterlock interlock;
    private final Set<String> seenKeys =
            Collections.synchronizedSet(new LinkedHashSet<>());

    public CommandVerifier(String deviceId, CommandSigner signer, SafetyInterlock interlock) {
        this.deviceId = deviceId;
        this.signer = signer;
        this.interlock = interlock;
    }

    public Verdict verify(Map<String, Object> command, Instant now, boolean forceDoorOpen) {
        // 1. Signature (BR7).
        if (!signer.verify(command)) {
            return Verdict.refuse("INVALID_SIGNATURE");
        }

        // 2. Addressed to this machine (FR4.6).
        Object target = command.get("deviceId");
        if (!(target instanceof String text) || !deviceId.equals(text)) {
            return Verdict.refuse("WRONG_DEVICE");
        }

        // 3a. Still valid (BR7).
        Instant expiresAt;
        try {
            expiresAt = Instant.parse(String.valueOf(command.get("expiresAt")));
        } catch (DateTimeParseException | NullPointerException ex) {
            return Verdict.refuse("MALFORMED_EXPIRY");
        }
        if (now.isAfter(expiresAt)) {
            return Verdict.refuse("COMMAND_EXPIRED");
        }

        // 3b. Not seen before (NFR3.4). The key is remembered whether or not
        // the command goes on to succeed, so a replay is refused either way.
        Object key = command.get("idempotencyKey");
        if (!(key instanceof String keyText) || keyText.isBlank()) {
            return Verdict.refuse("MISSING_IDEMPOTENCY_KEY");
        }
        if (!seenKeys.add(keyText)) {
            return Verdict.refuse("DUPLICATE_COMMAND");
        }

        // 4. Safety interlocks (BR8).
        if (forceDoorOpen) {
            return Verdict.refuse("DOOR_OPEN");
        }
        int slotNumber = intOf(command.get("slotNumber"), -1);
        int doseMl = intOf(command.get("doseMl"), 1);
        String blocked = interlock.blockingReason(slotNumber, doseMl);
        if (blocked != null) {
            return Verdict.refuse(blocked);
        }

        return Verdict.accept();
    }

    /** How many distinct commands this device has already seen. */
    public int seenCount() {
        return seenKeys.size();
    }

    private static int intOf(Object value, int fallback) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String text) {
            try {
                return Integer.parseInt(text.trim());
            } catch (NumberFormatException ignored) {
                return fallback;
            }
        }
        return fallback;
    }
}
