package com.todo.controller;

import com.todo.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

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
