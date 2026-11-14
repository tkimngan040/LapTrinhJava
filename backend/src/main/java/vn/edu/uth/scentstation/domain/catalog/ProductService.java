package vn.edu.uth.scentstation.domain.catalog;

import java.util.List;
import java.util.Locale;
import java.util.Objects;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.domain.brand.Brand;
import vn.edu.uth.scentstation.domain.brand.BrandRepository;
import vn.edu.uth.scentstation.domain.brand.BrandStatus;
import vn.edu.uth.scentstation.security.TenantContext;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;

    public ProductService(
            ProductRepository productRepository,
            BrandRepository brandRepository) {

        this.productRepository = productRepository;
        this.brandRepository = brandRepository;
    }

    // Get all products with optional filters
    @Transactional(readOnly = true)
    public List<ProductDtos.ProductResponse> findAll(
            ProductStatus status,
            String keyword,
            Long requestedBrandId) {

        Long brandId = resolveBrandId(requestedBrandId);

        List<Product> products = brandId == null
                ? productRepository.findAll(
                        Sort.by(Sort.Direction.ASC, "name"))
                : productRepository.findByBrandIdOrderByNameAsc(
                        brandId.longValue());

        String normalizedKeyword = keyword == null
                ? ""
                : keyword.trim().toLowerCase(Locale.ROOT);

        return products.stream()
                .filter(product -> status == null
                        || product.getStatus() == status)
                .filter(product -> normalizedKeyword.isEmpty()
                        || contains(product.getName(), normalizedKeyword)
                        || contains(product.getDescription(), normalizedKeyword)
                        || contains(product.getFragranceNotes(), normalizedKeyword))
                .map(this::toResponse)
                .toList();
    }

    // Get product by ID
    @Transactional(readOnly = true)
    public ProductDtos.ProductResponse findById(Long productId) {

        if (productId == null) {
            throw ApiException.badRequest(
                    "PRODUCT_ID_REQUIRED",
                    "Product ID is required");
        }

        return toResponse(requireProduct(productId.longValue()));
    }

    // Create a new product
    public ProductDtos.ProductResponse create(
            ProductDtos.ProductRequest request) {

        Long resolvedBrandId = resolveBrandId(request.brandId());
        long brandId = requireResolvedBrandId(resolvedBrandId);

        Brand brand = requireBrand(brandId);

        Product product = new Product();
        product.setBrand(brand);

        applyRequest(product, request);

        product.setStatus(request.status() == null
                ? ProductStatus.ACTIVE
                : request.status());

        return toResponse(productRepository.save(product));
    }

    // Update an existing product
    public ProductDtos.ProductResponse update(
            Long productId,
            ProductDtos.ProductRequest request) {

        if (productId == null) {
            throw ApiException.badRequest(
                    "PRODUCT_ID_REQUIRED",
                    "Product ID is required");
        }

        Product product = requireProduct(productId.longValue());

        Long requestedBrandId = resolveBrandId(request.brandId());

        if (!Objects.equals(
                product.getBrand().getId(),
                requestedBrandId)) {

            throw ApiException.badRequest(
                    "PRODUCT_BRAND_CHANGE_NOT_ALLOWED",
                    "A product cannot be moved to another brand");
        }

        applyRequest(product, request);

        if (request.status() != null) {
            product.setStatus(request.status());
        }

        return toResponse(productRepository.save(product));
    }

    // Update product status
    public ProductDtos.ProductResponse updateStatus(
            Long productId,
            ProductDtos.StatusRequest request) {

        if (productId == null) {
            throw ApiException.badRequest(
                    "PRODUCT_ID_REQUIRED",
                    "Product ID is required");
        }

        Product product = requireProduct(productId.longValue());

        product.setStatus(request.status());

        return toResponse(productRepository.save(product));
    }

    // Resolve the brand ID according to the current user's scope
    private Long resolveBrandId(Long requestedBrandId) {

        if (TenantContext.isPlatformScope()) {

            if (requestedBrandId == null) {
                throw ApiException.badRequest(
                        "BRAND_ID_REQUIRED",
                        "Platform administrators must specify a brand ID");
            }

            return requestedBrandId;
        }

        if (!TenantContext.hasBrandScope()) {
            throw ApiException.forbidden(
                    "BRAND_SCOPE_REQUIRED",
                    "The current account is not assigned to a brand");
        }

        Long currentBrandId = TenantContext.getBrandId();

        if (currentBrandId == null) {
            throw ApiException.forbidden(
                    "BRAND_SCOPE_REQUIRED",
                    "The current account has no brand assigned");
        }

        if (requestedBrandId != null
                && !currentBrandId.equals(requestedBrandId)) {

            throw ApiException.forbidden(
                    "CROSS_BRAND_ACCESS",
                    "You cannot access another brand's products");
        }

        return currentBrandId;
    }

    // Ensure that the resolved brand ID is not null
    private long requireResolvedBrandId(Long brandId) {

        if (brandId == null) {
            throw ApiException.badRequest(
                    "BRAND_ID_REQUIRED",
                    "Brand ID is required");
        }

        return brandId.longValue();
    }

    // Find and validate a brand
    private Brand requireBrand(long brandId) {

        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> ApiException.notFound(
                        "BRAND_NOT_FOUND",
                        "Brand " + brandId + " was not found"));

        if (brand.getStatus() != BrandStatus.ACTIVE) {
            throw ApiException.badRequest(
                    "BRAND_NOT_ACTIVE",
                    "Products cannot be created for a suspended brand");
        }

        return brand;
    }

    // Find a product according to the current user's permission scope
    private Product requireProduct(long productId) {

        if (TenantContext.isPlatformScope()) {

            return productRepository.findById(productId)
                    .orElseThrow(() -> ApiException.notFound(
                            "PRODUCT_NOT_FOUND",
                            "Product " + productId + " was not found"));
        }

        if (TenantContext.hasBrandScope()) {

            Long brandId = TenantContext.getBrandId();

            if (brandId == null) {
                throw ApiException.forbidden(
                        "BRAND_SCOPE_REQUIRED",
                        "The current account has no brand assigned");
            }

            return productRepository
                    .findByIdAndBrand_Id(
                            productId, brandId.longValue())
                    .orElseThrow(() -> ApiException.notFound(
                            "PRODUCT_NOT_FOUND",
                            "Product " + productId + " was not found"));
        }

        throw ApiException.forbidden(
                "BRAND_SCOPE_REQUIRED",
                "The current account is not assigned to a brand");
    }

    // Apply request data to a product
    private void applyRequest(
            Product product,
            ProductDtos.ProductRequest request) {

        product.setName(request.name().trim());
        product.setDescription(request.description());
        product.setFragranceNotes(request.fragranceNotes());
        product.setImageUrl(request.imageUrl());
        product.setPricePerSpray(request.pricePerSpray());
    }

    // Convert Product entity to response DTO
    private ProductDtos.ProductResponse toResponse(Product product) {

        Brand brand = product.getBrand();

        return new ProductDtos.ProductResponse(
                product.getId(),
                brand.getId(),
                brand.getName(),
                product.getName(),
                product.getDescription(),
                product.getFragranceNotes(),
                product.getImageUrl(),
                product.getPricePerSpray(),
                product.getStatus());
    }

    // Check whether a string contains the search keyword
    private boolean contains(String value, String keyword) {

        return value != null
                && value.toLowerCase(Locale.ROOT).contains(keyword);
    }
}
