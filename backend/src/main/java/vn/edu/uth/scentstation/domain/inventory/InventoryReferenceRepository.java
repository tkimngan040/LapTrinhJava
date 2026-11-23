package vn.edu.uth.scentstation.domain.inventory;

import jakarta.persistence.*;

import org.springframework.stereotype.Repository;

import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.domain.catalog.MachineSlot;
import vn.edu.uth.scentstation.domain.catalog.Product;

/** Inventory-scoped catalogue lookups without changing the catalogue package. */
@Repository
public class InventoryReferenceRepository {
    @PersistenceContext private EntityManager entityManager;

    public Product product(Long id, Long brandId) {
        return entityManager
                .createQuery(
                        "select p from Product p where p.id = :id and (:brand is null or p.brand.id"
                                + " = :brand)",
                        Product.class)
                .setParameter("id", id)
                .setParameter("brand", brandId)
                .getResultStream()
                .findFirst()
                .orElseThrow(
                        () ->
                                ApiException.notFound(
                                        "PRODUCT_NOT_FOUND", "No product in the permitted brand"));
    }

    public MachineSlot lockSlot(Long id, Long brandId) {
        return entityManager
                .createQuery(
                        "select s from MachineSlot s where s.id = :id and (:brand is null or"
                                + " s.machine.brand.id = :brand)",
                        MachineSlot.class)
                .setParameter("id", id)
                .setParameter("brand", brandId)
                .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                .getResultStream()
                .findFirst()
                .orElseThrow(
                        () ->
                                ApiException.notFound(
                                        "SLOT_NOT_FOUND", "No slot in the permitted brand"));
    }

    public boolean hasUnsettledCommand(Long slotId) {
        return entityManager
                        .createQuery(
                                "select count(c) from DispenseCommand c left join c.order o where"
                                    + " c.slot.id = :slot and (c.status in"
                                    + " (vn.edu.uth.scentstation.domain.dispensing.CommandStatus.ISSUED,"
                                    + " vn.edu.uth.scentstation.domain.dispensing.CommandStatus.ACKNOWLEDGED)"
                                    + " or o.status ="
                                    + " vn.edu.uth.scentstation.domain.order.OrderStatus.UNCERTAIN)",
                                Long.class)
                        .setParameter("slot", slotId)
                        .getSingleResult()
                > 0;
    }
}
