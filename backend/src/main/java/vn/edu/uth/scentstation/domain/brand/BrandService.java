package vn.edu.uth.scentstation.domain.brand;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.scentstation.common.ApiException;

import java.util.List;

@Service
@Transactional
@PreAuthorize("hasRole('PLATFORM_SUPER_ADMIN')")
public class BrandService {

    @PersistenceContext
    private EntityManager entityManager;

    private final BrandRepository brandRepository;

    public BrandService(BrandRepository brandRepository) {
        this.brandRepository = brandRepository;
    }

    public record BrandResponse(
            Long id,
            String name,
            BrandStatus status
    ) {
    }

    @Transactional(readOnly = true)
    public List<BrandResponse> findAll() {
        return brandRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public BrandResponse create(String name) {
        name = normalizeName(name);
        checkDuplicate(name, null);
        Brand brand = new Brand();
        brand.setName(name);
        brand.setStatus(BrandStatus.ACTIVE);

        return toResponse(brandRepository.save(brand));
    }

    public BrandResponse update(Long id, String name) {
        Brand brand = requireBrand(id);
        name = normalizeName(name);
        checkDuplicate(name, id);
        brand.setName(name);

        return toResponse(brandRepository.save(brand));
    }

    public BrandResponse activate(Long id) {
        return changeStatus(id, BrandStatus.ACTIVE);
    }

    public BrandResponse suspend(Long id) {
        return changeStatus(id, BrandStatus.SUSPENDED);
    }

    private BrandResponse changeStatus(Long id, BrandStatus status) {
        Brand brand = requireBrand(id);
        brand.setStatus(status);

        return toResponse(brandRepository.save(brand));
    }

    private Brand requireBrand(Long id) {
        return brandRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound(
                        "BRAND_NOT_FOUND",
                        "Không tìm thấy thương hiệu"
                ));
    }

    private void checkDuplicate(String name, Long excludedId) {
        // Serialise name checks without changing the shared schema/repository.
        entityManager.createNativeQuery("select pg_advisory_xact_lock(731001)").getSingleResult();
        var query = entityManager.createQuery(
                "select count(b) from Brand b where lower(b.name) = lower(:name)"
                        + (excludedId == null ? "" : " and b.id <> :id"), Long.class)
                .setParameter("name", name);
        if (excludedId != null) {
            query.setParameter("id", excludedId);
        }
        if (query.getSingleResult() > 0) {
            throw ApiException.conflict("BRAND_NAME_ALREADY_EXISTS", "Tên thương hiệu đã được sử dụng");
        }
    }

    private String normalizeName(String name) {
        if (name == null || name.isBlank()) {
            throw ApiException.badRequest(
                    "INVALID_BRAND_NAME",
                    "Tên thương hiệu không được để trống"
            );
        }

        String normalized = name.strip();

        if (normalized.length() > 120) {
            throw ApiException.badRequest(
                    "INVALID_BRAND_NAME",
                    "Tên thương hiệu tối đa 120 ký tự"
            );
        }

        return normalized;
    }

    private BrandResponse toResponse(Brand brand) {
        return new BrandResponse(
                brand.getId(),
                brand.getName(),
                brand.getStatus()
        );
    }
}
