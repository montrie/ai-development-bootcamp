package com.todo.controller;

import com.todo.model.SortMode;
import com.todo.model.User;
import com.todo.repository.UserRepository;
import com.todo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.Arrays;
import java.util.Map;

@Tag(name = "Users", description = "Manage the authenticated user's own account")
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    public UserController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @Operation(summary = "Change password", description = "Changes the password of the currently authenticated user")
    @ApiResponse(responseCode = "204", description = "Password changed successfully")
    @ApiResponse(responseCode = "400", description = "Current password is incorrect")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PatchMapping("/self/password")
    public void changePassword(@RequestBody ChangePasswordRequest req, Principal principal) {
        userService.changeOwnPassword(principal.getName(), req.currentPassword(), req.newPassword());
    }

    @Operation(summary = "Get current user profile", description = "Returns profile information for the authenticated user")
    @ApiResponse(responseCode = "200", description = "User profile")
    @GetMapping("/me")
    public Map<String, String> getMe(Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
        return Map.of("sortMode", user.getSortMode());
    }

    @Operation(summary = "Update sort mode", description = "Updates the sort mode preference for the authenticated user")
    @ApiResponse(responseCode = "200", description = "Sort mode updated")
    @ApiResponse(responseCode = "400", description = "Invalid sort mode value")
    @PatchMapping("/me/sort-mode")
    public void updateSortMode(@RequestBody UpdateSortModeRequest req, Principal principal) {
        boolean valid = Arrays.stream(SortMode.values())
                .anyMatch(m -> m.name().equals(req.sortMode()));
        if (!valid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid sortMode: " + req.sortMode());
        }
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
        user.setSortMode(req.sortMode());
        userRepository.save(user);
    }

    @ExceptionHandler(UserService.InvalidCurrentPasswordException.class)
    public ResponseEntity<Void> handleWrongPassword() {
        return ResponseEntity.badRequest().build();
    }

    record ChangePasswordRequest(String currentPassword, String newPassword) {}

    record UpdateSortModeRequest(String sortMode) {}
}
