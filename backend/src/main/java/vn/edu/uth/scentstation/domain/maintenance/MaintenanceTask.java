package vn.edu.uth.scentstation.domain.maintenance;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import vn.edu.uth.scentstation.common.BaseEntity;
import vn.edu.uth.scentstation.domain.brand.Brand;
import vn.edu.uth.scentstation.domain.user.User;

import java.time.Instant;

@Entity
@Table(name = "maintenance_tasks")
@AttributeOverride(name = "id", column = @Column(name = "task_id"))
public class MaintenanceTask extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private MaintenanceTicket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_user_id")
    private User assignedUser;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "task_name", nullable = false, length = 255)
    private String taskName;

    @Column(name = "task_result", columnDefinition = "TEXT")
    private String taskResult;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "PENDING";

    @Column(name = "completed_at")
    private Instant completedAt;

    public Brand getBrand() { return brand; }
    public void setBrand(Brand brand) { this.brand = brand; }

    public MaintenanceTicket getTicket() { return ticket; }
    public void setTicket(MaintenanceTicket ticket) { this.ticket = ticket; }

    public User getAssignedUser() { return assignedUser; }
    public void setAssignedUser(User assignedUser) { this.assignedUser = assignedUser; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public String getTaskName() { return taskName; }
    public void setTaskName(String taskName) { this.taskName = taskName; }

    public String getTaskResult() { return taskResult; }
    public void setTaskResult(String taskResult) { this.taskResult = taskResult; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
