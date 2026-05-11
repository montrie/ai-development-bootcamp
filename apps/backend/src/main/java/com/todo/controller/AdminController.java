package com.todo.controller;

import com.todo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Admin", description = "User management operations. Requires ADMIN role.")
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @Operation(summary = "List all users", description = "Returns all registered users with their roles")
    @ApiResponse(responseCode = "200", description = "List of users")
    @GetMapping("/users")
    public List<UserResponse> listUsers() {
        return userService.listUsers().stream()
                .map(u -> new UserResponse(u.getId(), u.getUsername(), u.getRole().name()))
                .toList();
    }

    @Operation(summary = "Delete a user", description = "Permanently deletes a user account and all associated todos")
    @ApiResponse(responseCode = "204", description = "User deleted successfully")
    @ApiResponse(responseCode = "404", description = "User not found")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/users/{id}")
    public void deleteUser(
            @Parameter(description = "ID of the user to delete") @PathVariable Long id) {
        userService.deleteUser(id);
    }

    @Operation(summary = "Reset a user's password", description = "Overwrites a user's password without requiring the current one")
    @ApiResponse(responseCode = "204", description = "Password reset successfully")
    @ApiResponse(responseCode = "404", description = "User not found")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PatchMapping("/users/{id}/password")
    public void resetPassword(
            @Parameter(description = "ID of the user whose password to reset") @PathVariable Long id,
            @RequestBody ResetPasswordRequest request) {
        userService.resetPassword(id, request.newPassword());
    }

    @ExceptionHandler(UserService.UserNotFoundException.class)
    public ResponseEntity<Void> handleUserNotFound() {
        return ResponseEntity.notFound().build();
    }

    record UserResponse(Long id, String username, String role) {}
    record ResetPasswordRequest(String newPassword) {}
}
