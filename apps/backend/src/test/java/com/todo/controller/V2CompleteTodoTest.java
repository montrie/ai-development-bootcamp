package com.todo.controller;

import com.todo.model.Todo;
import com.todo.model.User;
import com.todo.repository.TodoRepository;
import com.todo.repository.UserRepository;
import com.todo.service.JwtService;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import com.todo.support.MockUserFactory;
import com.todo.support.TestSecurityConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TodoController.class)
@Import(TestSecurityConfig.class)
class V2CompleteTodoTest {

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

    Todo existing;

    @BeforeEach
    void setUp() {
        User owner = new User();
        owner.setUsername("user");

        existing = new Todo();
        existing.setText("Buy milk");
        existing.setUser(owner);
    }

    @Test
    void updatesDoneStateAndReturnsTodo() throws Exception {
        Todo updated = new Todo();
        updated.setText("Buy milk");

        given(repository.findById(1)).willReturn(Optional.of(existing));
        given(repository.save(any(Todo.class))).willReturn(updated);

        mvc.perform(patch("/api/todos/1")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"done\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("Buy milk"));
    }

    @Test
    void returnsAccessDeniedWhenIdDoesNotExist() throws Exception {
        given(repository.findById(99)).willReturn(Optional.empty());

        mvc.perform(patch("/api/todos/99")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"done\":true}"))
                .andExpect(status().isForbidden());
    }
}
