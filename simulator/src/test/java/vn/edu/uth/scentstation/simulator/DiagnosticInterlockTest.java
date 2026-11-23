package vn.edu.uth.scentstation.simulator;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.*;

class DiagnosticInterlockTest {
    private final CommandSigner signer = new CommandSigner("dev-command-signing-secret");
    private final SafetyInterlock interlock = new SafetyInterlock(4, 100);
    private final CommandVerifier verifier = new CommandVerifier("TEST-MACHINE", signer, interlock);

    @Test
    void onlySignedDiagnosticMayRunDuringMaintenance() {
        interlock.setMaintenanceMode(true);
        assertEquals(
                "MAINTENANCE_MODE",
                verifier.verify(command("CUSTOMER"), Instant.now(), false).reason());
        assertTrue(verifier.verify(command("DIAGNOSTIC"), Instant.now(), false).accepted());
    }

    @Test
    void diagnosticNeverBypassesDoorCriticalErrorOrEmptySlot() {
        interlock.setMaintenanceMode(true);
        interlock.setDoorOpen(true);
        assertEquals(
                "DOOR_OPEN", verifier.verify(command("DIAGNOSTIC"), Instant.now(), false).reason());
        interlock.setDoorOpen(false);
        interlock.setCriticalError(true);
        assertEquals(
                "CRITICAL_ERROR",
                verifier.verify(command("DIAGNOSTIC"), Instant.now(), false).reason());
        interlock.setCriticalError(false);
        interlock.consume(1, 100);
        assertEquals(
                "SLOT_EMPTY",
                verifier.verify(command("DIAGNOSTIC"), Instant.now(), false).reason());
    }

    @Test
    void changingCustomerPurposeInvalidatesSignature() {
        var tampered = command("CUSTOMER");
        tampered.put("purpose", "DIAGNOSTIC");
        assertEquals("INVALID_SIGNATURE", verifier.verify(tampered, Instant.now(), false).reason());
    }

    private Map<String, Object> command(String purpose) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("deviceId", "TEST-MACHINE");
        fields.put("purpose", purpose);
        fields.put("idempotencyKey", UUID.randomUUID().toString());
        fields.put("slotNumber", 1);
        fields.put("doseMl", 2);
        fields.put("sprayDurationMs", 800);
        fields.put("expiresAt", Instant.now().plusSeconds(30).toString());
        fields.put("signature", signer.sign(fields));
        return fields;
    }
}
