package vn.edu.uth.scentstation.domain.dispensing;

/** Lifecycle of one dispensing command. ISSUED and ACKNOWLEDGED count as in flight (BR6). */
public enum CommandStatus {
    ISSUED,
    ACKNOWLEDGED,
    REJECTED,
    SUCCEEDED,
    FAILED,
    TIMED_OUT
}
