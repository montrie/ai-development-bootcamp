package com.todo.controller;

import com.todo.model.AuditLog;
import com.todo.service.AuditService;
import com.todo.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;
    private final AuditService auditService;

    public AdminController(UserService userService, AuditService auditService) {
        this.userService = userService;
        this.auditService = auditService;
    }

    @GetMapping("/users")
    public List<UserResponse> listUsers() {
        return userService.listUsers().stream()
                .map(u -> new UserResponse(u.getId(), u.getUsername(), u.getRole().name()))
                .toList();
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PatchMapping("/users/{id}/password")
    public void resetPassword(@PathVariable Long id, @RequestBody ResetPasswordRequest request) {
        userService.resetPassword(id, request.newPassword());
    }

    @PostMapping("/audit-logs/search")
    public List<AuditLogResponse> searchAuditLogs(@RequestBody AuditLogFilterRequest filter) {
        OffsetDateTime start = filter.startDate() != null
            ? OffsetDateTime.parse(filter.startDate()) : null;
        OffsetDateTime end = filter.endDate() != null
            ? OffsetDateTime.parse(filter.endDate()) : null;
        return auditService.search(filter.actionType(), filter.username(), start, end).stream()
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

    record UserResponse(Long id, String username, String role) {}
    record ResetPasswordRequest(String newPassword) {}
    record AuditLogFilterRequest(String actionType, String username, String startDate, String endDate) {}
    record AuditLogResponse(Long id, String timestamp, String actionType,
                             String actorUsername, String outcome, Long resourceId) {}
}
