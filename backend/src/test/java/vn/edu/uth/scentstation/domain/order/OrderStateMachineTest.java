package vn.edu.uth.scentstation.domain.order;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Covers the whole of Report section 2.9.2 without Spring and without a
 * database, which is why these run in milliseconds.
 *
 * <p>Test identifiers UT-01 to UT-03 in docs/test-plan.md.
 */
class OrderStateMachineTest {

    private final OrderStateMachine stateMachine = new OrderStateMachine();

    /** The table of Report section 2.9.2, written out once. */
    private static final Map<OrderStatus, Set<OrderStatus>> SPEC = Map.of(
            OrderStatus.PENDING, EnumSet.of(OrderStatus.PAID, OrderStatus.CANCELLED, OrderStatus.EXPIRED),
            OrderStatus.PAID, EnumSet.of(OrderStatus.DISPENSING),
            OrderStatus.DISPENSING, EnumSet.of(OrderStatus.DISPENSED, OrderStatus.FAILED, OrderStatus.UNCERTAIN),
            OrderStatus.DISPENSED, EnumSet.noneOf(OrderStatus.class),
            OrderStatus.FAILED, EnumSet.of(OrderStatus.REFUNDED),
            OrderStatus.UNCERTAIN, EnumSet.of(OrderStatus.DISPENSED, OrderStatus.FAILED),
            OrderStatus.CANCELLED, EnumSet.noneOf(OrderStatus.class),
            OrderStatus.EXPIRED, EnumSet.noneOf(OrderStatus.class),
            OrderStatus.REFUNDED, EnumSet.noneOf(OrderStatus.class));

    private Order orderIn(OrderStatus status) {
        Order order = new Order();
        order.setStatus(status);
        return order;
    }

    @Nested
    @DisplayName("UT-01 the transition table matches Report section 2.9.2")
    class TransitionTable {

        @Test
        @DisplayName("nine states and ten legal transitions, and nothing else")
        void tableMatchesTheSpecification() {
            int legal = 0;
            for (Map.Entry<OrderStatus, Set<OrderStatus>> entry : SPEC.entrySet()) {
                OrderStatus from = entry.getKey();
                for (OrderStatus to : OrderStatus.values()) {
                    boolean expected = entry.getValue().contains(to);
                    assertThat(from.canMoveTo(to))
                            .as("%s -> %s", from, to)
                            .isEqualTo(expected);
                    if (expected) {
                        legal++;
                    }
                }
            }
            assertThat(OrderStatus.values()).hasSize(9);
            assertThat(legal).isEqualTo(10);
        }

        @Test
        @DisplayName("every legal transition can actually be taken")
        void everyLegalTransitionSucceeds() {
            SPEC.forEach((from, targets) -> targets.forEach(to -> {
                if (from.requiresHumanReview()) {
                    return; // covered by the UNCERTAIN tests below
                }
                Order order = orderIn(from);
                assertThatCode(() -> stateMachine.transition(order, to))
                        .as("%s -> %s", from, to)
                        .doesNotThrowAnyException();
                assertThat(order.getStatus()).isEqualTo(to);
            }));
        }

        @Test
        @DisplayName("the allowed set cannot be modified from outside")
        void transitionTableIsImmutable() {
            assertThatThrownBy(() -> OrderStatus.PENDING.allowedNext().add(OrderStatus.DISPENSED))
                    .isInstanceOf(UnsupportedOperationException.class);
        }
    }

    @Nested
    @DisplayName("UT-02 a terminal state cannot be left")
    class TerminalStates {

        @Test
        void terminalStatesAreExactlyTheFourExpected() {
            assertThat(List.of(OrderStatus.values()).stream().filter(OrderStatus::isTerminal).toList())
                    .containsExactlyInAnyOrder(OrderStatus.DISPENSED, OrderStatus.CANCELLED,
                            OrderStatus.EXPIRED, OrderStatus.REFUNDED);
        }

        @Test
        @DisplayName("DISPENSED to anything at all is refused")
        void dispensedIsFinal() {
            for (OrderStatus target : OrderStatus.values()) {
                if (target == OrderStatus.DISPENSED) {
                    continue;
                }
                Order order = orderIn(OrderStatus.DISPENSED);
                assertThatThrownBy(() -> stateMachine.transition(order, target))
                        .as("DISPENSED -> %s", target)
                        .isInstanceOf(IllegalOrderTransitionException.class);
            }
        }

        @Test
        @DisplayName("moving to the state it is already in changes nothing and does not throw")
        void sameStateIsANoOp() {
            Order order = orderIn(OrderStatus.DISPENSED);
            assertThatCode(() -> stateMachine.transition(order, OrderStatus.DISPENSED))
                    .doesNotThrowAnyException();
            assertThat(order.getStatus()).isEqualTo(OrderStatus.DISPENSED);
        }
    }

    @Nested
    @DisplayName("UT-03 UNCERTAIN may only be left by human review (BR14, NFR4.5)")
    class UncertainNeedsReview {

        @Test
        @DisplayName("no automatic transition can leave UNCERTAIN")
        void automaticTransitionIsRefused() {
            for (OrderStatus target : List.of(OrderStatus.DISPENSED, OrderStatus.FAILED,
                    OrderStatus.REFUNDED, OrderStatus.CANCELLED)) {
                Order order = orderIn(OrderStatus.UNCERTAIN);
                assertThatThrownBy(() -> stateMachine.transition(order, target))
                        .as("automatic UNCERTAIN -> %s", target)
                        .isInstanceOf(IllegalOrderTransitionException.class)
                        .hasMessageContaining("resolved by a person");
            }
        }

        @Test
        @DisplayName("review may conclude DISPENSED")
        void reviewMayConcludeDispensed() {
            Order order = orderIn(OrderStatus.UNCERTAIN);
            stateMachine.resolveUncertain(order, OrderStatus.DISPENSED,
                    "Checked the machine: the spray did happen");
            assertThat(order.getStatus()).isEqualTo(OrderStatus.DISPENSED);
            assertThat(order.getReviewNote()).contains("did happen");
        }

        @Test
        @DisplayName("review may conclude FAILED")
        void reviewMayConcludeFailed() {
            Order order = orderIn(OrderStatus.UNCERTAIN);
            stateMachine.resolveUncertain(order, OrderStatus.FAILED, "Nothing was dispensed");
            assertThat(order.getStatus()).isEqualTo(OrderStatus.FAILED);
        }

        @Test
        @DisplayName("review may not conclude anything else")
        void reviewMayNotConcludeAnythingElse() {
            Order order = orderIn(OrderStatus.UNCERTAIN);
            assertThatThrownBy(() ->
                    stateMachine.resolveUncertain(order, OrderStatus.REFUNDED, "note"))
                    .isInstanceOf(IllegalOrderTransitionException.class);
        }

        @Test
        @DisplayName("a review note is required, so the decision is never anonymous")
        void reviewNoteIsRequired() {
            Order order = orderIn(OrderStatus.UNCERTAIN);
            assertThatThrownBy(() ->
                    stateMachine.resolveUncertain(order, OrderStatus.FAILED, "   "))
                    .isInstanceOf(IllegalOrderTransitionException.class)
                    .hasMessageContaining("review note is required");
            assertThat(order.getStatus()).isEqualTo(OrderStatus.UNCERTAIN);
        }

        @Test
        @DisplayName("an order that is not UNCERTAIN cannot be resolved by review")
        void onlyUncertainCanBeReviewed() {
            Order order = orderIn(OrderStatus.DISPENSING);
            assertThatThrownBy(() ->
                    stateMachine.resolveUncertain(order, OrderStatus.FAILED, "note"))
                    .isInstanceOf(IllegalOrderTransitionException.class);
        }
    }

    @Test
    @DisplayName("a failure reason is kept on the order")
    void failureReasonIsRecorded() {
        Order order = orderIn(OrderStatus.DISPENSING);
        stateMachine.transition(order, OrderStatus.FAILED, "DOOR_OPEN");
        assertThat(order.getFailureReason()).isEqualTo("DOOR_OPEN");
    }
}
