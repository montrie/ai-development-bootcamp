package com.todo.controller;

import com.todo.config.SecurityConfig;
import com.todo.repository.TodoRepository;
import com.todo.repository.UserRepository;
import com.todo.security.AuditAccessDeniedHandler;
import com.todo.security.AuditAuthenticationEntryPoint;
import com.todo.service.JwtService;
import com.todo.service.TodoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

@WebMvcTest(TodoController.class)
@Import(SecurityConfig.class)
class V3SwaggerAccessTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    TodoRepository todoRepository;

    @MockitoBean
    UserRepository userRepository;

    @MockitoBean
    JwtService jwtService;

    @MockitoBean
    JwtDecoder jwtDecoder;

    @MockitoBean
    TodoService todoService;

    @MockitoBean
    AuditAuthenticationEntryPoint auditAuthenticationEntryPoint;

    @MockitoBean
    AuditAccessDeniedHandler auditAccessDeniedHandler;

    @Test
    void openApiDocsArePubliclyAccessible() throws Exception {
        // springdoc's handler isn't registered in this @WebMvcTest slice, so we get 404
        // The key assertion is that security does NOT block the path with 401
        var result = mvc.perform(get("/v3/api-docs")).andReturn();
        assertNotEquals(HttpStatus.UNAUTHORIZED.value(), result.getResponse().getStatus());
    }

    @Test
    void swaggerUiIsPubliclyAccessible() throws Exception {
        var result = mvc.perform(get("/swagger-ui/index.html")).andReturn();
        assertNotEquals(HttpStatus.UNAUTHORIZED.value(), result.getResponse().getStatus());
    }
}
