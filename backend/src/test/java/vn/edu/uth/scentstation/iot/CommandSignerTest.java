package vn.edu.uth.scentstation.iot;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Test identifiers UT-04 to UT-06 in docs/test-plan.md.
 *
 * <p>These also protect the one thing most likely to break the device link
 * silently: the two copies of {@link CanonicalJson} and {@link CommandSigner},
 * one here and one in the simulator, producing different bytes. If someone
 * edits one copy, these tests still pass but every command is refused in
 * practice — so the simulator carries the same tests, and both must be run.
 */
class CommandSignerTest {

    private static final String SECRET = "dev-command-signing-secret";
    private final CommandSigner signer = new CommandSigner(SECRET);

    private Map<String, Object> command() {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("deviceId", "KIOSK-001");
        payload.put("commandId", 55L);
        payload.put("slotNumber", 2);
        payload.put("doseMl", 1);
        payload.put("sprayDurationMs", 800);
        payload.put("idempotencyKey", "c1f0a2");
        payload.put("expiresAt", "2026-11-09T10:30:30Z");
        return payload;
    }

    @Test
    @DisplayName("UT-04 signing then verifying succeeds (NFR2.6)")
    void signThenVerify() {
        Map<String, Object> payload = command();
        payload.put(CommandSigner.SIGNATURE_FIELD, signer.sign(payload));
        assertThat(signer.verify(payload)).isTrue();
    }

    @Test
    @DisplayName("UT-05 changing one field invalidates the signature (BR7)")
    void tamperedPayloadFailsVerification() {
        Map<String, Object> payload = command();
        payload.put(CommandSigner.SIGNATURE_FIELD, signer.sign(payload));

        Map<String, Object> tampered = new LinkedHashMap<>(payload);
        tampered.put("doseMl", 2);
        assertThat(signer.verify(tampered)).isFalse();

        Map<String, Object> redirected = new LinkedHashMap<>(payload);
        redirected.put("deviceId", "KIOSK-002");
        assertThat(signer.verify(redirected)).isFalse();
    }

    @Test
    @DisplayName("a different secret cannot verify the signature")
    void wrongSecretFailsVerification() {
        Map<String, Object> payload = command();
        payload.put(CommandSigner.SIGNATURE_FIELD, signer.sign(payload));
        assertThat(new CommandSigner("a-different-secret-entirely").verify(payload)).isFalse();
    }

    @Test
    @DisplayName("a missing, blank or nonsense signature never verifies")
    void absentSignatureFailsVerification() {
        Map<String, Object> payload = command();
        assertThat(signer.verify(payload)).isFalse();

        payload.put(CommandSigner.SIGNATURE_FIELD, "");
        assertThat(signer.verify(payload)).isFalse();

        payload.put(CommandSigner.SIGNATURE_FIELD, "not-a-signature");
        assertThat(signer.verify(payload)).isFalse();
    }

    @Test
    @DisplayName("the key order of the payload does not change the signature")
    void keyOrderDoesNotMatter() {
        Map<String, Object> forwards = command();
        List<String> keys = new ArrayList<>(forwards.keySet());
        Collections.reverse(keys);

        Map<String, Object> backwards = new LinkedHashMap<>();
        keys.forEach(key -> backwards.put(key, forwards.get(key)));

        assertThat(signer.sign(backwards)).isEqualTo(signer.sign(forwards));
    }

    @Test
    @DisplayName("the signature field is excluded from what is signed")
    void signatureFieldIsNotPartOfThePayload() {
        Map<String, Object> first = command();
        first.put(CommandSigner.SIGNATURE_FIELD, "aaaa");
        Map<String, Object> second = command();
        second.put(CommandSigner.SIGNATURE_FIELD, "bbbb");

        assertThat(signer.sign(first)).isEqualTo(signer.sign(second));
    }

    @Test
    @DisplayName("the canonical form is sorted, compact and escaped")
    void canonicalFormIsStable() {
        assertThat(signer.canonicalForm(command())).isEqualTo(
                "{\"commandId\":55,\"deviceId\":\"KIOSK-001\",\"doseMl\":1,"
                        + "\"expiresAt\":\"2026-11-09T10:30:30Z\",\"idempotencyKey\":\"c1f0a2\","
                        + "\"slotNumber\":2,\"sprayDurationMs\":800}");

        Map<String, Object> awkward = command();
        awkward.put("note", "he said \"hi\"\\ then\nstopped");
        String json = signer.canonicalForm(awkward);
        assertThat(json).contains("\\\"hi\\\"").contains("\\\\").contains("\\n");
    }

    @Test
    @DisplayName("an unsupported value type is refused rather than silently written")
    void unsupportedTypeIsRejected() {
        Map<String, Object> payload = command();
        payload.put("ratio", 1.5d);
        assertThatThrownBy(() -> signer.canonicalForm(payload))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported value type");
    }

    @Test
    @DisplayName("signing is deterministic and produces a 64-character hex digest")
    void signingIsDeterministic() {
        assertThat(signer.sign(command()))
                .isEqualTo(signer.sign(command()))
                .hasSize(64)
                .matches("[0-9a-f]{64}");
    }

    @Test
    @DisplayName("a secret shorter than the algorithm needs is refused at construction")
    void blankSecretIsRejected() {
        assertThatThrownBy(() -> new CommandSigner("  "))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
