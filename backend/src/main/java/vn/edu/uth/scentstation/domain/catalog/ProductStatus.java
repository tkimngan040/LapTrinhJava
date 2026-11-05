package vn.edu.uth.scentstation.domain.catalog;

/**
 * Whether a fragrance may still be sold.
 *
 * <p>A product is never deleted, because orders keep a foreign key to it and
 * their history has to stay readable. {@link #DISCONTINUED} is how a brand
 * retires one for good.
 */
public enum ProductStatus {
    ACTIVE,
    INACTIVE,
    DISCONTINUED
}
