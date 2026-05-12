package com.todo.controller;

import com.todo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@Tag(name = "Users", description = "Manage the authenticated user's own account")
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @Operation(summary = "Change password", description = "Changes the password of the currently authenticated user")
    @ApiResponse(responseCode = "204", description = "Password changed successfully")
    @ApiResponse(responseCode = "400", description = "Current password is incorrect")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PatchMapping("/self/password")
    public void changePassword(@RequestBody ChangePasswordRequest req, Principal principal) {
        userService.changeOwnPassword(principal.getName(), req.currentPassword(), req.newPassword());
    }

    @ExceptionHandler(UserService.InvalidCurrentPasswordException.class)
    public ResponseEntity<Void> handleWrongPassword() {
        return ResponseEntity.badRequest().build();
    }

    record ChangePasswordRequest(String currentPassword, String newPassword) {}
}
