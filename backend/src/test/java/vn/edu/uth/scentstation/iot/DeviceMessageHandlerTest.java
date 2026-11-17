package vn.edu.uth.scentstation.iot;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.edu.uth.scentstation.domain.catalog.MachineService;
import vn.edu.uth.scentstation.domain.dispensing.DispenseService;

import static org.mockito.Mockito.verifyNoInteractions;

/** UT-15: malformed MQTT payloads must not reach business services. */
@ExtendWith(MockitoExtension.class)
class DeviceMessageHandlerTest {

    @Mock
    private DispenseService dispenseService;
    @Mock
    private MachineService machineService;

    @Test
    @DisplayName("UT-15 — ignore malformed acknowledgement and result JSON")
    void malformedCommandMessagesDoNotCallBusinessServices() {
        DeviceMessageHandler handler =
                new DeviceMessageHandler(dispenseService, machineService, new ObjectMapper());

        handler.handle("device-1", Topics.ACK, "{not-json");
        handler.handle("device-1", Topics.RESULT, "{not-json");

        verifyNoInteractions(dispenseService, machineService);
    }
}
