package com.todo.controller;

import com.todo.config.SecurityConfig;
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
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TodoController.class)
@Import(SecurityConfig.class)
class V5DueDateTest {

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

    @MockitoBean
    AuditService auditService;

    @MockitoBean
    TodoService todoService;

    @MockitoBean
    AuditAuthenticationEntryPoint auditAuthenticationEntryPoint;

    @MockitoBean
    AuditAccessDeniedHandler auditAccessDeniedHandler;

    User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = MockUserFactory.mockDefaultUser(userRepository);
    }

    @Test
    void createTodoWithDueDateReturnsDueDateInResponse() throws Exception {
        Todo saved = new Todo();
        saved.setText("Pay bills");
        saved.setDueDate(LocalDate.of(2027, 6, 15));

        given(repository.save(any(Todo.class))).willReturn(saved);

        mvc.perform(post("/api/todos")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"Pay bills\",\"dueDate\":\"2027-06-15\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.text").value("Pay bills"))
                .andExpect(jsonPath("$.dueDate").value("2027-06-15"));
    }

    @Test
    void createTodoWithoutDueDateReturnsNullDueDate() throws Exception {
        Todo saved = new Todo();
        saved.setText("Buy milk");

        given(repository.save(any(Todo.class))).willReturn(saved);

        mvc.perform(post("/api/todos")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"Buy milk\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.text").value("Buy milk"))
                .andExpect(jsonPath("$.dueDate").isEmpty());
    }

    @Test
    void getAllTodosIncludesDueDateField() throws Exception {
        Todo todo = new Todo();
        todo.setText("Submit report");
        todo.setDueDate(LocalDate.of(2027, 12, 1));

        given(todoService.getTodosForUser(mockUser)).willReturn(List.of(todo));

        mvc.perform(get("/api/todos").with(MockUserFactory.jwtAs("user")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].text").value("Submit report"))
                .andExpect(jsonPath("$[0].dueDate").value("2027-12-01"));
    }
}
