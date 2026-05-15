package com.todo.controller;

import com.todo.aspect.AuditAspect;
import com.todo.config.SecurityConfig;
import com.todo.model.AuditActionType;
import com.todo.model.Todo;
import com.todo.model.User;
import com.todo.repository.TodoRepository;
import com.todo.repository.UserRepository;
import com.todo.security.AuditAccessDeniedHandler;
import com.todo.security.AuditAuthenticationEntryPoint;
import com.todo.service.AuditService;
import com.todo.service.JwtService;
import com.todo.service.TodoService;
import com.todo.support.MockUserFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TodoController.class)
@Import({SecurityConfig.class, AuditAspect.class})
@EnableAspectJAutoProxy
class V4AuditTodoMutationsTest {

    @Autowired MockMvc mvc;

    @MockitoBean AuditService auditService;
    @MockitoBean TodoService todoService;
    @MockitoBean TodoRepository todoRepository;
    @MockitoBean UserRepository userRepository;
    @MockitoBean JwtService jwtService;
    @MockitoBean JwtDecoder jwtDecoder;
    @MockitoBean AuditAuthenticationEntryPoint auditAuthenticationEntryPoint;
    @MockitoBean AuditAccessDeniedHandler auditAccessDeniedHandler;

    private User user;

    @BeforeEach
    void setUp() {
        user = MockUserFactory.mockDefaultUser(userRepository);
    }

    private Todo todoOwnedByUser() {
        Todo todo = new Todo();
        todo.setText("task");
        todo.setUser(user);
        return todo;
    }

    @Test
    void createTodoLogsAuditEvent() throws Exception {
        // Todo.id has no setter — @GeneratedValue assigns it at persist time.
        // A spy lets us stub getId() so the assertion covers a real non-null ID.
        Todo saved = spy(todoOwnedByUser());
        given(saved.getId()).willReturn(42L);

        given(todoRepository.save(any(Todo.class))).willReturn(saved);

        mvc.perform(post("/api/todos")
                .with(MockUserFactory.jwtAs("user"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"text\":\"task\"}"))
            .andExpect(status().isCreated());

        verify(auditService).log(AuditActionType.TODO_CREATED, "user", "SUCCESS", 42L);
    }

    @Test
    void toggleTodoLogsAuditEvent() throws Exception {
        // Todo.id has no setter — @GeneratedValue assigns it at persist time.
        // A spy lets us stub getId() so the assertion covers a real non-null ID.
        Todo todo = spy(todoOwnedByUser());
        given(todo.getId()).willReturn(7L);

        given(todoRepository.findById(7L)).willReturn(Optional.of(todo));
        given(todoRepository.save(any(Todo.class))).willReturn(todo);

        mvc.perform(patch("/api/todos/7")
                .with(MockUserFactory.jwtAs("user"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"done\":true}"))
            .andExpect(status().isOk());

        verify(auditService).log(AuditActionType.TODO_UPDATED, "user", "SUCCESS", 7L);
    }

    @Test
    void deleteTodoLogsAuditEvent() throws Exception {
        Todo todo = todoOwnedByUser();

        given(todoRepository.findById(7L)).willReturn(Optional.of(todo));

        mvc.perform(delete("/api/todos/7")
                .with(MockUserFactory.jwtAs("user")))
            .andExpect(status().isNoContent());

        verify(auditService).log(AuditActionType.TODO_DELETED, "user", "SUCCESS", 7L);
    }
}
