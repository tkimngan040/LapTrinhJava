package vn.edu.uth.scentstation.domain.inventory;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.config.ScentStationProperties;
import vn.edu.uth.scentstation.domain.brand.Brand;
import vn.edu.uth.scentstation.domain.catalog.MachineSlot;
import vn.edu.uth.scentstation.domain.catalog.MachineSlotRepository;
import vn.edu.uth.scentstation.domain.catalog.SlotStatus;
import vn.edu.uth.scentstation.domain.dispensing.DispenseCommand;
import vn.edu.uth.scentstation.domain.order.Order;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** UT-08 and UT-09: unit tests for confirmed-spray inventory effects. */
@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventoryBottleRepository bottleRepository;
    @Mock
    private InventoryMovementRepository movementRepository;
    @Mock
    private MachineSlotRepository slotRepository;

    @Test
    @DisplayName("UT-08 — deduct exactly one dose and persist its DISPENSE movement")
    void confirmedSprayDeductsDoseAndRecordsMovement() {
        ScentStationProperties properties = new ScentStationProperties();
        properties.getDispensing().setDoseMl(1);
        InventoryService service = new InventoryService(
                bottleRepository, movementRepository, slotRepository, properties);
        InventoryBottle bottle = bottle("5.000");
        MachineSlot slot = slot();
        DispenseCommand command = command(slot, 44L);
        when(bottleRepository.findBySlotIdAndStatus(12L, BottleStatus.INSTALLED))
                .thenReturn(Optional.of(bottle));

        service.deductForCommand(command);

        assertThat(bottle.getRemainingQuantity()).isEqualByComparingTo("4.000");
        ArgumentCaptor<InventoryMovement> movement =
                ArgumentCaptor.forClass(InventoryMovement.class);
        verify(movementRepository).save(movement.capture());
        assertThat(movement.getValue().getCommandId()).isEqualTo(44L);
        assertThat(movement.getValue().getMovementType()).isEqualTo(MovementType.DISPENSE);
        assertThat(movement.getValue().getQuantity()).isEqualByComparingTo("-1");
        assertThat(movement.getValue().getQuantityBefore()).isEqualByComparingTo("5");
        assertThat(movement.getValue().getQuantityAfter()).isEqualByComparingTo("4");
        verify(bottleRepository).save(bottle);
    }

    @Test
    @DisplayName("UT-09 — reject an insufficient dose without changing stock or recording movement")
    void insufficientVolumeLeavesBottleAndMovementHistoryUnchanged() {
        ScentStationProperties properties = new ScentStationProperties();
        properties.getDispensing().setDoseMl(1);
        InventoryService service = new InventoryService(
                bottleRepository, movementRepository, slotRepository, properties);
        InventoryBottle bottle = bottle("0.500");
        DispenseCommand command = command(slot(), 44L);
        when(bottleRepository.findBySlotIdAndStatus(12L, BottleStatus.INSTALLED))
                .thenReturn(Optional.of(bottle));

        assertThatThrownBy(() -> service.deductForCommand(command))
                .isInstanceOfSatisfying(ApiException.class,
                        exception -> assertThat(exception.getCode()).isEqualTo("INSUFFICIENT_VOLUME"));

        assertThat(bottle.getRemainingQuantity()).isEqualByComparingTo("0.500");
        verify(movementRepository, never()).save(any(InventoryMovement.class));
        verify(bottleRepository, never()).save(any(InventoryBottle.class));
    }

    private static InventoryBottle bottle(String remaining) {
        InventoryBottle bottle = new InventoryBottle();
        bottle.setBrand(new Brand());
        bottle.setBottleCode("bottle-1");
        bottle.setRemainingQuantity(new BigDecimal(remaining));
        bottle.setStatus(BottleStatus.INSTALLED);
        return bottle;
    }

    private static MachineSlot slot() {
        MachineSlot slot = new MachineSlot();
        slot.setId(12L);
        slot.setSlotNumber(2);
        slot.setLowStockThreshold(new BigDecimal("1.000"));
        slot.setStatus(SlotStatus.AVAILABLE);
        return slot;
    }

    private static DispenseCommand command(MachineSlot slot, Long id) {
        Order order = new Order();
        order.setId(31L);
        DispenseCommand command = new DispenseCommand();
        command.setId(id);
        command.setOrder(order);
        command.setSlot(slot);
        return command;
    }
}
