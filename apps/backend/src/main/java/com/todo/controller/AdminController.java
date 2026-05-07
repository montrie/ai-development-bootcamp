package com.todo.controller;

import com.todo.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
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

    @ExceptionHandler(UserService.UserNotFoundException.class)
    public ResponseEntity<Void> handleUserNotFound() {
        return ResponseEntity.notFound().build();
    }

    record UserResponse(Long id, String username, String role) {}
    record ResetPasswordRequest(String newPassword) {}
}
