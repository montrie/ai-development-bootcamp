package com.todo.support;

import com.todo.repository.TodoRepository;
import com.todo.repository.TodoShareRepository;
import com.todo.repository.UserRepository;
import com.todo.security.AuditAccessDeniedHandler;
import com.todo.security.AuditAuthenticationEntryPoint;
import com.todo.service.AuditService;
import com.todo.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Base class for @WebMvcTest(TodoController.class) tests.
 * Declares all required mock beans so subclasses do not need to repeat them.
 */
public abstract class TodoControllerTestBase {

    @Autowired
    protected MockMvc mvc;

    @MockitoBean
    protected TodoRepository todoRepository;

    @MockitoBean
    protected TodoShareRepository todoShareRepository;

    @MockitoBean
    protected UserRepository userRepository;

    @MockitoBean
    protected AuditService auditService;

    @MockitoBean
    protected JwtService jwtService;

    @MockitoBean
    protected JwtDecoder jwtDecoder;

    @MockitoBean
    protected AuditAuthenticationEntryPoint auditAuthenticationEntryPoint;

    @MockitoBean
    protected AuditAccessDeniedHandler auditAccessDeniedHandler;
}
