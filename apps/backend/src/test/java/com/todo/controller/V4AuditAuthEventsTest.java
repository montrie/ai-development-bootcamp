package com.todo.controller;

import com.todo.model.AuditActionType;
import com.todo.security.AuditAccessDeniedHandler;
import com.todo.security.AuditAuthenticationEntryPoint;
import com.todo.service.AuditService;
import com.todo.service.JwtService;
import com.todo.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
class V4AuditAuthEventsTest {

    @Autowired MockMvc mvc;

    @MockitoBean UserService userService;
    @MockitoBean AuditService auditService;
    @MockitoBean JwtService jwtService;
    @MockitoBean AuditAuthenticationEntryPoint auditAuthenticationEntryPoint;
    @MockitoBean AuditAccessDeniedHandler auditAccessDeniedHandler;

    @Test
    void registerLogsUserRegisteredOnSuccess() throws Exception {
        given(userService.register("alice", "secret123")).willReturn("token");

        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"alice\",\"password\":\"secret123\"}"))
            .andExpect(status().isCreated());

        verify(auditService).log(AuditActionType.USER_REGISTERED.name(), "alice", "SUCCESS", null);
    }

    @Test
    void loginLogsUserLoginSuccessOnValidCredentials() throws Exception {
        given(userService.login("alice", "secret123")).willReturn("token");

        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"alice\",\"password\":\"secret123\"}"))
            .andExpect(status().isOk());

        verify(auditService).log(AuditActionType.USER_LOGIN.name(), "alice", "SUCCESS", null);
    }

    @Test
    void loginLogsUserLoginFailureOnInvalidCredentials() throws Exception {
        given(userService.login(any(), any()))
            .willThrow(new UserService.InvalidCredentialsException());

        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"alice\",\"password\":\"wrong\"}"))
            .andExpect(status().isUnauthorized());

        verify(auditService).log(AuditActionType.USER_LOGIN.name(), "alice", "FAILURE", null);
    }
}
