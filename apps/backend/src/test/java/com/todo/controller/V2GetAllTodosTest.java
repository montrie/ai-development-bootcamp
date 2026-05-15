package com.todo.controller;

import com.todo.model.Todo;
import com.todo.model.User;
import com.todo.config.SecurityConfig;
import com.todo.support.MockUserFactory;
import com.todo.support.TodoControllerTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.context.annotation.Import;
import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;

import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TodoController.class)
@Import(SecurityConfig.class)
class V2GetAllTodosTest extends TodoControllerTestBase {

    User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = MockUserFactory.mockDefaultUser(userRepository);
    }

    @Test
    void returnsEmptyArrayWhenNoTodosExist() throws Exception {
        given(todoRepository.findAllByUserOrderByCreatedAtAsc(mockUser)).willReturn(List.of());

        mvc.perform(get("/api/todos").with(MockUserFactory.jwtAs("user")))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void returnsAllTodosOrderedByCreationTime() throws Exception {
        Todo first = new Todo();
        first.setText("Buy milk");
        Todo second = new Todo();
        second.setText("Call dentist");

        given(todoRepository.findAllByUserOrderByCreatedAtAsc(mockUser)).willReturn(List.of(first, second));

        mvc.perform(get("/api/todos").with(MockUserFactory.jwtAs("user")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].text").value("Buy milk"))
                .andExpect(jsonPath("$[1].text").value("Call dentist"));
    }
}
