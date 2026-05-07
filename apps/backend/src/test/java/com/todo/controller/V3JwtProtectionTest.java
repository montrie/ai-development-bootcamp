package com.todo.controller;

import com.todo.repository.TodoRepository;
import com.todo.repository.UserRepository;
import com.todo.service.JwtService;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import com.todo.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TodoController.class)
@Import(SecurityConfig.class)
class V3JwtProtectionTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    TodoRepository repository;

    @MockitoBean
    UserRepository userRepository;

    @MockitoBean
    JwtService jwtService;

    @MockitoBean
    JwtDecoder jwtDecoder;

    @Test
    void getWithoutJwtReturns401() throws Exception {
        mvc.perform(get("/api/todos"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void postWithoutJwtReturns401() throws Exception {
        mvc.perform(post("/api/todos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"Buy milk\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void patchWithoutJwtReturns401() throws Exception {
        mvc.perform(patch("/api/todos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"done\":true}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteByIdWithoutJwtReturns401() throws Exception {
        mvc.perform(delete("/api/todos/1"))
                .andExpect(status().isUnauthorized());
    }
}
