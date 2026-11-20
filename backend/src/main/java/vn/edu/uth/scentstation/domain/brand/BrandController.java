package vn.edu.uth.scentstation.domain.brand;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/brands")
public class BrandController {

    private final BrandService brandService;

    public BrandController(BrandService brandService) {
        this.brandService = brandService;
    }

    public record BrandRequest(
            @NotBlank(message = "Tên thương hiệu không được để trống")
            @Size(max = 120, message = "Tên thương hiệu tối đa 120 ký tự")
            String name
    ) {
    }

    @GetMapping
    public List<BrandService.BrandResponse> findAll() {
        return brandService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BrandService.BrandResponse create(
            @Valid @RequestBody BrandRequest request
    ) {
        return brandService.create(request.name());
    }

    @PutMapping("/{id}")
    public BrandService.BrandResponse update(
            @PathVariable Long id,
            @Valid @RequestBody BrandRequest request
    ) {
        return brandService.update(id, request.name());
    }

    @PatchMapping("/{id}/activate")
    public BrandService.BrandResponse activate(
            @PathVariable Long id
    ) {
        return brandService.activate(id);
    }

    @PatchMapping("/{id}/suspend")
    public BrandService.BrandResponse suspend(
            @PathVariable Long id
    ) {
        return brandService.suspend(id);
    }
}
