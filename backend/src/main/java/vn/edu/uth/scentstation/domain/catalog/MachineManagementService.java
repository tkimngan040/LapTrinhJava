
package vn.edu.uth.scentstation.domain.catalog;

import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.domain.brand.Brand;
import vn.edu.uth.scentstation.domain.brand.BrandRepository;
import vn.edu.uth.scentstation.domain.brand.BrandStatus;
import vn.edu.uth.scentstation.security.TenantContext;

@Service
@Transactional(readOnly = true)
public class MachineManagementService {

    private final MachineRepository machineRepository;
    private final LocationRepository locationRepository;
    private final BrandRepository brandRepository;

    public MachineManagementService(
            MachineRepository machineRepository,
            LocationRepository locationRepository,
            BrandRepository brandRepository) {

        this.machineRepository = machineRepository;
        this.locationRepository = locationRepository;
        this.brandRepository = brandRepository;
    }

    // Get all machines according to the current user's scope
    public List<MachineDtos.MachineResponse> findAll() {

        List<Machine> machines;

        if (TenantContext.isPlatformScope()) {

            machines = machineRepository.findAll();

        } else if (TenantContext.hasBrandScope()) {

            Long brandId = TenantContext.getBrandId();

            if (brandId == null) {
                throw ApiException.forbidden(
                        "BRAND_SCOPE_REQUIRED",
                        "A valid brand scope is required");
            }

            machines = machineRepository.findByBrandId(
                    brandId.longValue());

        } else {

            throw ApiException.forbidden(
                    "BRAND_SCOPE_REQUIRED",
                    "A valid brand scope is required");
        }

        return machines.stream()
                .map(this::toResponse)
                .toList();
    }

    // Get a machine by ID
    public MachineDtos.MachineResponse findById(Long id) {

        if (id == null) {
            throw ApiException.badRequest(
                    "MACHINE_ID_REQUIRED",
                    "Machine ID is required");
        }

        return toResponse(requireMachine(id.longValue()));
    }

    // Create a new machine
    @Transactional
    public MachineDtos.MachineResponse create(
            MachineDtos.MachineRequest request) {

        long brandId = resolveBrandId(request.brandId());

        Brand brand = requireActiveBrand(brandId);

        checkDuplicateSerialNumber(
                request.serialNumber(), null);

        checkDuplicateDeviceIdentity(
                request.deviceIdentity(), null);

        Machine machine = new Machine();

        machine.setBrand(brand);
        machine.setLocation(
                resolveLocation(request.locationId(), brandId));
        machine.setSerialNumber(request.serialNumber());
        machine.setDeviceIdentity(request.deviceIdentity());
        machine.setFirmwareVersion(request.firmwareVersion());

        machine.setConnectionStatus(ConnectionStatus.OFFLINE);

        machine.setOperatingStatus(
                request.operatingStatus() != null
                        ? request.operatingStatus()
                        : OperatingStatus.ACTIVE);

        return toResponse(machineRepository.save(machine));
    }

    // Update an existing machine
    @Transactional
    public MachineDtos.MachineResponse update(
            Long id,
            MachineDtos.MachineRequest request) {

        if (id == null) {
            throw ApiException.badRequest(
                    "MACHINE_ID_REQUIRED",
                    "Machine ID is required");
        }

        long machineId = id.longValue();

        Machine machine = requireMachine(machineId);
        long currentBrandId = requireBrandId(machine);

        if (request.brandId() != null
                && request.brandId().longValue() != currentBrandId) {

            throw ApiException.forbidden(
                    "CROSS_BRAND_UPDATE",
                    "A machine cannot be moved to another brand");
        }

        checkDuplicateSerialNumber(
                request.serialNumber(), id);

        checkDuplicateDeviceIdentity(
                request.deviceIdentity(), id);

        machine.setLocation(
                resolveLocation(
                        request.locationId(), currentBrandId));

        machine.setSerialNumber(request.serialNumber());
        machine.setDeviceIdentity(request.deviceIdentity());
        machine.setFirmwareVersion(request.firmwareVersion());

        if (request.operatingStatus() != null) {
            machine.setOperatingStatus(
                    request.operatingStatus());
        }

        return toResponse(machineRepository.save(machine));
    }

    // Update machine operating status
    @Transactional
    public MachineDtos.MachineResponse updateOperatingStatus(
            Long id,
            MachineDtos.OperatingStatusRequest request) {

        if (id == null) {
            throw ApiException.badRequest(
                    "MACHINE_ID_REQUIRED",
                    "Machine ID is required");
        }

        Machine machine = requireMachine(id.longValue());

        machine.setOperatingStatus(
                request.operatingStatus());

        return toResponse(machineRepository.save(machine));
    }

    // Find a machine according to the current user's permission scope
    private Machine requireMachine(long id) {

        if (TenantContext.isPlatformScope()) {

            return machineRepository.findById(id)
                    .orElseThrow(() -> ApiException.notFound(
                            "MACHINE_NOT_FOUND",
                            "Machine not found"));
        }

        if (TenantContext.hasBrandScope()) {

            Long brandId = TenantContext.getBrandId();

            if (brandId == null) {
                throw ApiException.forbidden(
                        "BRAND_SCOPE_REQUIRED",
                        "A valid brand scope is required");
            }

            return machineRepository.findByIdAndBrand_Id(
                            id, brandId.longValue())
                    .orElseThrow(() -> ApiException.notFound(
                            "MACHINE_NOT_FOUND",
                            "Machine not found"));
        }

        throw ApiException.forbidden(
                "BRAND_SCOPE_REQUIRED",
                "A valid brand scope is required");
    }

    // Resolve brand ID according to the current user's scope
    private long resolveBrandId(Long requestedBrandId) {

        if (TenantContext.isPlatformScope()) {

            if (requestedBrandId == null) {
                throw ApiException.badRequest(
                        "BRAND_ID_REQUIRED",
                        "Platform administrator must provide brandId");
            }

            return requestedBrandId.longValue();
        }

        if (TenantContext.hasBrandScope()) {

            Long currentBrandId = TenantContext.getBrandId();

            if (currentBrandId == null) {
                throw ApiException.forbidden(
                        "BRAND_SCOPE_REQUIRED",
                        "A valid brand scope is required");
            }

            if (requestedBrandId != null
                    && requestedBrandId.longValue()
                            != currentBrandId.longValue()) {

                throw ApiException.forbidden(
                        "CROSS_BRAND_ACCESS",
                        "You cannot access another brand");
            }

            return currentBrandId.longValue();
        }

        throw ApiException.forbidden(
                "BRAND_SCOPE_REQUIRED",
                "A valid brand scope is required");
    }

    // Get the brand ID from a machine
    private long requireBrandId(Machine machine) {

        if (machine.getBrand() == null
                || machine.getBrand().getId() == null) {

            throw ApiException.badRequest(
                    "MACHINE_BRAND_REQUIRED",
                    "Machine must belong to a brand");
        }

        return machine.getBrand().getId().longValue();
    }

    // Find and validate an active brand
    private Brand requireActiveBrand(long brandId) {

        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> ApiException.notFound(
                        "BRAND_NOT_FOUND",
                        "Brand not found"));

        if (brand.getStatus() != BrandStatus.ACTIVE) {
            throw ApiException.badRequest(
                    "BRAND_INACTIVE",
                    "Cannot assign a machine to an inactive brand");
        }

        return brand;
    }

    // Find and validate a location belonging to the same brand
    private Location resolveLocation(
            Long locationId,
            long brandId) {

        if (locationId == null) {
            return null;
        }

        Location location;

        if (TenantContext.isPlatformScope()) {

            location = locationRepository.findById(
                            locationId.longValue())
                    .orElseThrow(() -> ApiException.notFound(
                            "LOCATION_NOT_FOUND",
                            "Location not found"));

            if (location.getBrand() == null
                    || location.getBrand().getId() == null
                    || location.getBrand().getId().longValue()
                            != brandId) {

                throw ApiException.forbidden(
                        "CROSS_BRAND_LOCATION",
                        "Location does not belong to the machine brand");
            }

        } else {

            location = locationRepository
                    .findByIdAndBrand_Id(
                            locationId.longValue(), brandId)
                    .orElseThrow(() -> ApiException.notFound(
                            "LOCATION_NOT_FOUND",
                            "Location not found"));
        }

        if (location.getStatus() != LocationStatus.ACTIVE) {
            throw ApiException.badRequest(
                    "LOCATION_INACTIVE",
                    "Cannot assign a machine to an inactive location");
        }

        return location;
    }

    // Check duplicate serial number
    private void checkDuplicateSerialNumber(
            String serialNumber,
            Long currentMachineId) {

        machineRepository.findBySerialNumber(serialNumber)
                .filter(machine ->
                        !Objects.equals(
                                machine.getId(), currentMachineId))
                .ifPresent(machine -> {
                    throw ApiException.conflict(
                            "DUPLICATE_SERIAL_NUMBER",
                            "Serial number already exists");
                });
    }

    // Check duplicate device identity
    private void checkDuplicateDeviceIdentity(
            String deviceIdentity,
            Long currentMachineId) {

        machineRepository.findByDeviceIdentity(deviceIdentity)
                .filter(machine ->
                        !Objects.equals(
                                machine.getId(), currentMachineId))
                .ifPresent(machine -> {
                    throw ApiException.conflict(
                            "DUPLICATE_DEVICE_IDENTITY",
                            "Device identity already exists");
                });
    }

    // Convert Machine entity to response DTO
    private MachineDtos.MachineResponse toResponse(
            Machine machine) {

        Brand brand = machine.getBrand();
        Location location = machine.getLocation();

        return new MachineDtos.MachineResponse(
                machine.getId(),
                brand.getId(),
                brand.getName(),
                location != null ? location.getId() : null,
                location != null ? location.getName() : null,
                machine.getSerialNumber(),
                machine.getDeviceIdentity(),
                machine.getFirmwareVersion(),
                machine.getConnectionStatus(),
                machine.getOperatingStatus());
    }
}
