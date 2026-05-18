package com.todo.controller;

import com.todo.model.Todo;
import com.todo.model.User;
import com.todo.config.SecurityConfig;
import com.todo.support.MockUserFactory;
import com.todo.support.TodoControllerTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TodoController.class)
@Import(SecurityConfig.class)
class V2CompleteTodoTest extends TodoControllerTestBase {

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

        given(todoRepository.findById(1L)).willReturn(Optional.of(existing));
        given(todoRepository.save(any(Todo.class))).willReturn(updated);

        mvc.perform(patch("/api/todos/1")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"done\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("Buy milk"));
    }

    @Test
    void returnsAccessDeniedWhenIdDoesNotExist() throws Exception {
        given(todoRepository.findById(99L)).willReturn(Optional.empty());

        mvc.perform(patch("/api/todos/99")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"done\":true}"))
                .andExpect(status().isForbidden());
    }
}
