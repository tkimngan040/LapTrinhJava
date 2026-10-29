package vn.edu.uth.scentstation.simulator;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;

/**
 * Signs and verifies a dispensing command with HMAC-SHA256 (NFR2.6, BR7).
 *
 * <p>The signature covers every field of the payload except {@code signature}
 * itself, written by {@link CanonicalJson} so both sides produce the same
 * bytes. A device that cannot reproduce the signature must refuse the command
 * and never actuate (Report section 2.9.3 step 8).
 *
 * <p><strong>Duplicated from the backend project; the two copies must stay
 * identical.</strong>
 *
 * <p>Plain Java on purpose: no Spring, no JSON library. That makes it trivial
 * to unit test and impossible for the two projects to drift through a
 * dependency upgrade.
 */
public final class CommandSigner {

    public static final String SIGNATURE_FIELD = "signature";
    private static final String ALGORITHM = "HmacSHA256";

    private final byte[] secret;

    public CommandSigner(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException("A command signing secret is required");
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    /** Hex-encoded HMAC over the payload, ignoring any signature already in it. */
    public String sign(Map<String, Object> payload) {
        return hmacHex(canonicalBytes(payload));
    }

    /**
     * True when {@code payload} carries a signature matching its own contents.
     *
     * <p>The comparison is constant-time. A plain {@code equals} leaks, through
     * how long it takes, how many leading characters were right, which is
     * enough to recover a signature one character at a time.
     */
    public boolean verify(Map<String, Object> payload) {
        Object presented = payload.get(SIGNATURE_FIELD);
        if (!(presented instanceof String signature) || signature.isBlank()) {
            return false;
        }
        String expected = sign(payload);
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                signature.getBytes(StandardCharsets.UTF_8));
    }

    /** The exact string that gets signed. Useful when a signature disagrees. */
    public String canonicalForm(Map<String, Object> payload) {
        return new String(canonicalBytes(payload), StandardCharsets.UTF_8);
    }

    private byte[] canonicalBytes(Map<String, Object> payload) {
        Map<String, Object> copy = new java.util.LinkedHashMap<>(payload);
        copy.remove(SIGNATURE_FIELD);
        return CanonicalJson.write(copy).getBytes(StandardCharsets.UTF_8);
    }

    private String hmacHex(byte[] message) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(new SecretKeySpec(secret, ALGORITHM));
            return HexFormat.of().formatHex(mac.doFinal(message));
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("HMAC-SHA256 is unavailable in this JVM", ex);
        }
    }
}
