package com.todo.controller;

import com.todo.model.Todo;
import com.todo.repository.TodoRepository;
import com.todo.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TodoController.class)
@WithMockUser(roles = "USER")
class V2CompleteTodoTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    TodoRepository repository;

    @MockitoBean
    JwtService jwtService;

    @Test
    void updatesDoneStateAndReturnsTodo() throws Exception {
        Todo existing = new Todo();
        existing.setText("Buy milk");

        Todo updated = new Todo();
        updated.setText("Buy milk");

        given(repository.findById(1)).willReturn(Optional.of(existing));
        given(repository.save(any(Todo.class))).willReturn(updated);

        mvc.perform(patch("/api/todos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"done\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("Buy milk"));
    }

    @Test
    void returnsNotFoundWhenIdDoesNotExist() throws Exception {
        given(repository.findById(99)).willReturn(Optional.empty());

        mvc.perform(patch("/api/todos/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"done\":true}"))
                .andExpect(status().isNotFound());
    }
}
