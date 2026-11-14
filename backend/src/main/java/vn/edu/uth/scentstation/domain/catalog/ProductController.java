package vn.edu.uth.scentstation.domain.catalog;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    /**
     * List products with optional status, keyword and brand filters.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('PLATFORM_SUPER_ADMIN', 'BRAND_ADMIN', "
            + "'OPERATIONS_MANAGER', 'TECHNICIAN', 'INVENTORY_STAFF', 'VIEWER')")
    public ResponseEntity<List<ProductDtos.ProductResponse>> findAll(
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long brandId) {

        return ResponseEntity.ok(
                productService.findAll(status, keyword, brandId));
    }

    /**
     * Get one product by its ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_SUPER_ADMIN', 'BRAND_ADMIN', "
            + "'OPERATIONS_MANAGER', 'TECHNICIAN', 'INVENTORY_STAFF', 'VIEWER')")
    public ResponseEntity<ProductDtos.ProductResponse> findById(
            @PathVariable Long id) {

        return ResponseEntity.ok(productService.findById(id));
    }

    /**
     * Create a product.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_SUPER_ADMIN', 'BRAND_ADMIN', "
            + "'OPERATIONS_MANAGER')")
    public ResponseEntity<ProductDtos.ProductResponse> create(
            @Valid @RequestBody ProductDtos.ProductRequest request) {

        ProductDtos.ProductResponse response = productService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update product information without moving it to another brand.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_SUPER_ADMIN', 'BRAND_ADMIN', "
            + "'OPERATIONS_MANAGER')")
    public ResponseEntity<ProductDtos.ProductResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ProductDtos.ProductRequest request) {

        return ResponseEntity.ok(productService.update(id, request));
    }

    /**
     * Change the product lifecycle status.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('PLATFORM_SUPER_ADMIN', 'BRAND_ADMIN', "
            + "'OPERATIONS_MANAGER')")
    public ResponseEntity<ProductDtos.ProductResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ProductDtos.StatusRequest request) {

        return ResponseEntity.ok(productService.updateStatus(id, request));
    }
}
