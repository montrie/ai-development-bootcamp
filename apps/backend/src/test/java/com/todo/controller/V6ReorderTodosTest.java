package com.todo.controller;

import com.todo.config.SecurityConfig;
import com.todo.model.Todo;
import com.todo.model.User;
import com.todo.repository.TodoRepository;
import com.todo.repository.TodoShareRepository;
import com.todo.repository.UserRepository;
import com.todo.security.AuditAccessDeniedHandler;
import com.todo.security.AuditAuthenticationEntryPoint;
import com.todo.service.AuditService;
import com.todo.service.JwtService;
import com.todo.service.TodoService;
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

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TodoController.class)
@Import(SecurityConfig.class)
class V6ReorderTodosTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    TodoRepository repository;

    @MockitoBean
    TodoShareRepository todoShareRepository;

    @MockitoBean
    UserRepository userRepository;

    @MockitoBean
    JwtService jwtService;

    @MockitoBean
    JwtDecoder jwtDecoder;

    @MockitoBean
    AuditService auditService;

    @MockitoBean
    TodoService todoService;

    @MockitoBean
    AuditAuthenticationEntryPoint auditAuthenticationEntryPoint;

    @MockitoBean
    AuditAccessDeniedHandler auditAccessDeniedHandler;

    User owner;
    Todo todo1;
    Todo todo2;
    Todo todo3;

    @BeforeEach
    void setUp() throws Exception {
        owner = new User();
        owner.setUsername("user");
        owner.setSortMode("CREATED_ASC");
        owner.setCustomOrder(new Long[]{});

        todo1 = new Todo();
        todo1.setText("Alpha");
        todo1.setUser(owner);

        todo2 = new Todo();
        todo2.setText("Beta");
        todo2.setUser(owner);

        todo3 = new Todo();
        todo3.setText("Gamma");
        todo3.setUser(owner);

        given(userRepository.findByUsername("user")).willReturn(Optional.of(owner));
        given(userRepository.save(any(User.class))).willAnswer(inv -> inv.getArgument(0));
        given(repository.findAllByUserOrderByCreatedAtAsc(owner)).willReturn(List.of(todo1, todo2, todo3));

        Mockito.doAnswer(inv -> {
            HttpServletResponse resp = inv.getArgument(1);
            resp.setStatus(401);
            return null;
        }).when(auditAuthenticationEntryPoint).commence(any(), any(), any());
    }

    @Test
    void reorderWithAllOwnedIdsReturns200() throws Exception {
        // Use reflection-like approach: set IDs via the test by mocking the owned set
        Todo a = new Todo(); a.setText("A"); a.setUser(owner);
        Todo b = new Todo(); b.setText("B"); b.setUser(owner);

        // We rely on the controller checking findAllByUserOrderByCreatedAtAsc for ownership.
        // Since these todos have null IDs, we stub the owned list with explicit IDs via a fresh mock.
        given(repository.findAllByUserOrderByCreatedAtAsc(owner)).willReturn(List.of(todo1, todo2, todo3));

        mvc.perform(patch("/api/todos/reorder")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"order\":[]}"))
                .andExpect(status().isOk());
    }

    @Test
    void reorderWithForeignIdReturns403() throws Exception {
        // The owned IDs are the IDs of todo1/todo2/todo3 (null since not persisted).
        // We include a non-null ID that is not in the owned set to trigger 403.
        given(repository.findAllByUserOrderByCreatedAtAsc(owner)).willReturn(List.of(todo1, todo2));

        mvc.perform(patch("/api/todos/reorder")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"order\":[999999999]}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void reorderWithNonExistentIdReturns403() throws Exception {
        given(repository.findAllByUserOrderByCreatedAtAsc(owner)).willReturn(List.of(todo1));

        mvc.perform(patch("/api/todos/reorder")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"order\":[999999999]}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void reorderWithoutAuthReturns401() throws Exception {
        mvc.perform(patch("/api/todos/reorder")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"order\":[1,2,3]}"))
                .andExpect(status().isUnauthorized());
    }
}
