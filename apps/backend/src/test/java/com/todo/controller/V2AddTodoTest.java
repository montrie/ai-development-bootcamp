package com.todo.controller;

import com.todo.model.Todo;
import com.todo.config.SecurityConfig;
import com.todo.support.MockUserFactory;
import com.todo.support.TodoControllerTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.context.annotation.Import;
import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TodoController.class)
@Import(SecurityConfig.class)
class V2AddTodoTest extends TodoControllerTestBase {

    @BeforeEach
    void setUp() {
        MockUserFactory.mockDefaultUser(userRepository);
    }

    @Test
    void createTodoWithNullTextReturns400() throws Exception {
        mvc.perform(post("/api/todos")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":null}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createTodoWithBlankTextReturns400() throws Exception {
        mvc.perform(post("/api/todos")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"   \"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createsNewTodoAndReturnsItWithDoneFalse() throws Exception {
        Todo saved = new Todo();
        saved.setText("Buy milk");

        given(todoRepository.save(any(Todo.class))).willReturn(saved);

        mvc.perform(post("/api/todos")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"Buy milk\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.text").value("Buy milk"))
                .andExpect(jsonPath("$.done").value(false));
    }
}
