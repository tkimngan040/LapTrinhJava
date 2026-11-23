package vn.edu.uth.scentstation.domain.user;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import vn.edu.uth.scentstation.security.AuthenticatedUser;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/brand-admin")
    @ResponseStatus(HttpStatus.CREATED)
    public UserService.UserResponse createBrandAdmin(
            @Valid @RequestBody UserService.CreateBrandAdminRequest request) {
        return userService.createBrandAdmin(request);
    }

    @GetMapping
    public List<UserService.UserResponse> listUsers(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return userService.listUsers(principal);
    }

    @GetMapping("/{id}")
    public UserService.UserResponse detail(
            @PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser p) {
        return userService.detail(id, p);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserService.UserResponse create(
            @Valid @RequestBody UserService.CreateUserRequest r,
            @AuthenticationPrincipal AuthenticatedUser p) {
        return userService.createUser(r, p);
    }

    @PutMapping("/{id}")
    public UserService.UserResponse update(
            @PathVariable Long id,
            @Valid @RequestBody UserService.UpdateUserRequest r,
            @AuthenticationPrincipal AuthenticatedUser p) {
        return userService.update(id, r, p);
    }

    @PatchMapping("/{id}/lock")
    public UserService.UserResponse lock(
            @PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser p) {
        return userService.changeStatus(id, UserStatus.LOCKED, p);
    }

    @PatchMapping({"/{id}/unlock", "/{id}/activate"})
    public UserService.UserResponse activate(
            @PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser p) {
        return userService.changeStatus(id, UserStatus.ACTIVE, p);
    }

    @PatchMapping("/{id}/deactivate")
    public UserService.UserResponse deactivate(
            @PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser p) {
        return userService.changeStatus(id, UserStatus.DISABLED, p);
    }

    @PatchMapping("/{id}/password")
    public UserService.UserResponse password(
            @PathVariable Long id,
            @Valid @RequestBody UserService.PasswordRequest r,
            @AuthenticationPrincipal AuthenticatedUser p) {
        return userService.resetPassword(id, r, p);
    }

    @PatchMapping("/{id}/roles")
    public UserService.UserResponse roles(
            @PathVariable Long id,
            @Valid @RequestBody UserService.RolesRequest r,
            @AuthenticationPrincipal AuthenticatedUser p) {
        return userService.changeRoles(id, r, p);
    }
}
