package com.todo.controller;

import com.todo.config.SecurityConfig;
import com.todo.model.SortMode;
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
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
class V6GetUserProfileTest {

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

    @BeforeEach
    void setupSecurityMocks() throws Exception {
        Mockito.doAnswer(inv -> {
            HttpServletResponse resp = inv.getArgument(1);
            resp.setStatus(401);
            return null;
        }).when(auditAuthenticationEntryPoint).commence(any(), any(), any());
    }

    @Test
    void getMeReturnsSortModeForAuthenticatedUser() throws Exception {
        User alice = new User();
        alice.setUsername("alice");
        alice.setSortMode(SortMode.CREATED_ASC);

        given(userRepository.findByUsername("alice")).willReturn(Optional.of(alice));

        mvc.perform(get("/api/users/me").with(MockUserFactory.jwtAs("alice")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sortMode").value("CREATED_ASC"));
    }

    @Test
    void getMeReturnsCustomSortModeWhenSet() throws Exception {
        User bob = new User();
        bob.setUsername("bob");
        bob.setSortMode(SortMode.CUSTOM);

        given(userRepository.findByUsername("bob")).willReturn(Optional.of(bob));

        mvc.perform(get("/api/users/me").with(MockUserFactory.jwtAs("bob")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sortMode").value("CUSTOM"));
    }

    @Test
    void getMeWithoutJwtReturns401() throws Exception {
        mvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }
}
