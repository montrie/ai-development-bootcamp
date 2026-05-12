package com.todo.controller;

import com.todo.model.AuditActionType;
import com.todo.service.AuditService;
import com.todo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Auth", description = "Register and log in to obtain a JWT token")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final AuditService auditService;

    public AuthController(UserService userService, AuditService auditService) {
        this.userService = userService;
        this.auditService = auditService;
    }

    @Operation(summary = "Register", description = "Creates a new user account and returns a JWT token")
    @ApiResponse(responseCode = "201", description = "Account created, token returned",
        content = @Content(mediaType = "application/json",
            examples = @ExampleObject(value = "{\"token\": \"eyJhbGciOiJIUzI1NiJ9...\"}")))
    @ApiResponse(responseCode = "409", description = "Username already taken", content = @Content)
    @SecurityRequirements
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody AuthRequest request) {
        String token = userService.register(request.username(), request.password());
        auditService.log(AuditActionType.USER_REGISTERED.name(), request.username(), "SUCCESS", null);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("token", token));
    }

    @Operation(summary = "Login", description = "Authenticates an existing user and returns a JWT token")
    @ApiResponse(responseCode = "200", description = "Login successful, token returned",
        content = @Content(mediaType = "application/json",
            examples = @ExampleObject(value = "{\"token\": \"eyJhbGciOiJIUzI1NiJ9...\"}")))
    @ApiResponse(responseCode = "401", description = "Invalid credentials", content = @Content)
    @SecurityRequirements
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody AuthRequest request) {
        try {
            String token = userService.login(request.username(), request.password());
            auditService.log(AuditActionType.USER_LOGIN.name(), request.username(), "SUCCESS", null);
            return ResponseEntity.ok(Map.of("token", token));
        } catch (UserService.InvalidCredentialsException e) {
            auditService.log(AuditActionType.USER_LOGIN.name(), request.username(), "FAILURE", null);
            throw e;
        }
    }

    @ExceptionHandler(UserService.UsernameAlreadyTakenException.class)
    public ResponseEntity<Void> handleUsernameAlreadyTaken() {
        return ResponseEntity.status(HttpStatus.CONFLICT).build();
    }

    @ExceptionHandler(UserService.InvalidCredentialsException.class)
    public ResponseEntity<Void> handleInvalidCredentials() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    record AuthRequest(
        @Schema(example = "alice") String username,
        @Schema(example = "s3cr3t") String password
    ) {}
}
