package com.todo.controller;

import com.todo.aspect.AuditAction;
import com.todo.model.AuditActionType;
import com.todo.service.AuditService;
import com.todo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@Tag(name = "Admin", description = "User management operations. Requires ADMIN role.")
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;
    private final AuditService auditService;

    public AdminController(UserService userService, AuditService auditService) {
        this.userService = userService;
        this.auditService = auditService;
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
    @AuditAction(AuditActionType.ADMIN_DELETE_USER)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/users/{id}")
    public void deleteUser(
            @Parameter(description = "ID of the user to delete") @PathVariable Long id) {
        userService.deleteUser(id);
    }

    @Operation(summary = "Reset a user's password", description = "Overwrites a user's password without requiring the current one")
    @ApiResponse(responseCode = "204", description = "Password reset successfully")
    @ApiResponse(responseCode = "404", description = "User not found")
    @AuditAction(AuditActionType.ADMIN_RESET_PASSWORD)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PatchMapping("/users/{id}/password")
    public void resetPassword(
            @Parameter(description = "ID of the user whose password to reset") @PathVariable Long id,
            @RequestBody ResetPasswordRequest request) {
        userService.resetPassword(id, request.newPassword());
    }

    @GetMapping("/audit-logs")
    public List<AuditLogResponse> searchAuditLogs(
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        OffsetDateTime start = startDate != null ? OffsetDateTime.parse(startDate) : null;
        OffsetDateTime end = endDate != null ? OffsetDateTime.parse(endDate) : null;
        return auditService.search(actionType, username, start, end).stream()
            .map(a -> new AuditLogResponse(
                a.getId(), a.getTimestamp().toString(),
                a.getActionType(), a.getActorUsername(),
                a.getOutcome(), a.getResourceId()))
            .toList();
    }

    @GetMapping("/audit-logs/action-types")
    public List<String> getActionTypes() {
        return auditService.actionTypes();
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/audit-logs")
    public void deleteAuditLogs() {
        auditService.clearAll();
    }

    @ExceptionHandler(UserService.UserNotFoundException.class)
    public ResponseEntity<Void> handleUserNotFound() {
        return ResponseEntity.notFound().build();
    }

    @ExceptionHandler(DateTimeParseException.class)
    public ResponseEntity<Void> handleDateTimeParse() {
        return ResponseEntity.badRequest().build();
    }

    record UserResponse(Long id, String username, String role) {}
    record ResetPasswordRequest(String newPassword) {}
    record AuditLogResponse(Long id, String timestamp, String actionType,
                             String actorUsername, String outcome, Long resourceId) {}
}
