package vn.edu.uth.scentstation.domain.dispensing;

/** Stored when a command is authorised; never taken from a device result payload. */
public enum CommandPurpose {
    CUSTOMER,
    DIAGNOSTIC
}
