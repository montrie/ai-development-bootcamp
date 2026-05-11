package com.todo.controller;

import com.todo.service.AuditService;
import com.todo.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final AuditService auditService;

    public AuthController(UserService userService, AuditService auditService) {
        this.userService = userService;
        this.auditService = auditService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody AuthRequest request) {
        String token = userService.register(request.username(), request.password());
        auditService.log("USER_REGISTERED", request.username(), "SUCCESS", null);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("token", token));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody AuthRequest request) {
        try {
            String token = userService.login(request.username(), request.password());
            auditService.log("USER_LOGIN", request.username(), "SUCCESS", null);
            return ResponseEntity.ok(Map.of("token", token));
        } catch (UserService.InvalidCredentialsException e) {
            auditService.log("USER_LOGIN", request.username(), "FAILURE", null);
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

    record AuthRequest(String username, String password) {}
}
