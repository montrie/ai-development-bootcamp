package com.todo.controller;

import com.todo.config.SecurityConfig;
import com.todo.model.User;
import com.todo.repository.UserRepository;
import com.todo.security.AuditAccessDeniedHandler;
import com.todo.security.AuditAuthenticationEntryPoint;
import com.todo.service.JwtService;
import com.todo.service.UserService;
import com.todo.support.MockUserFactory;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
class V6SortModeTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    UserService userService;

    @MockitoBean
    UserRepository userRepository;

    @MockitoBean
    JwtService jwtService;

    @MockitoBean
    JwtDecoder jwtDecoder;

    @MockitoBean
    AuditAuthenticationEntryPoint auditAuthenticationEntryPoint;

    @MockitoBean
    AuditAccessDeniedHandler auditAccessDeniedHandler;

    User alice;

    @BeforeEach
    void setUp() throws Exception {
        alice = new User();
        alice.setUsername("alice");
        alice.setSortMode("CREATED_ASC");

        given(userRepository.findByUsername("alice")).willReturn(Optional.of(alice));
        given(userRepository.save(any(User.class))).willAnswer(inv -> inv.getArgument(0));

        Mockito.doAnswer(inv -> {
            HttpServletResponse resp = inv.getArgument(1);
            resp.setStatus(401);
            return null;
        }).when(auditAuthenticationEntryPoint).commence(any(), any(), any());
    }

    @Test
    void updateSortModeWithValidValueReturns200() throws Exception {
        mvc.perform(patch("/api/users/me/sort-mode")
                        .with(MockUserFactory.jwtAs("alice"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sortMode\":\"ALPHA_ASC\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void updateSortModeWithCreatedDescReturns200() throws Exception {
        mvc.perform(patch("/api/users/me/sort-mode")
                        .with(MockUserFactory.jwtAs("alice"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sortMode\":\"CREATED_DESC\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void updateSortModeWithDueDateEarliestFirstReturns200() throws Exception {
        mvc.perform(patch("/api/users/me/sort-mode")
                        .with(MockUserFactory.jwtAs("alice"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sortMode\":\"DUE_DATE_EARLIEST_FIRST\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void updateSortModeWithInvalidValueReturns400() throws Exception {
        mvc.perform(patch("/api/users/me/sort-mode")
                        .with(MockUserFactory.jwtAs("alice"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sortMode\":\"INVALID_MODE\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateSortModeWithoutAuthReturns401() throws Exception {
        mvc.perform(patch("/api/users/me/sort-mode")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sortMode\":\"ALPHA_ASC\"}"))
                .andExpect(status().isUnauthorized());
    }
}
