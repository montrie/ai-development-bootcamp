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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TodoController.class)
@Import(TestSecurityConfig.class)
class V2DeleteTodoTest {

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

    Todo existingTodo;

    @BeforeEach
    void setUp() {
        User owner = new User();
        owner.setUsername("user");

        existingTodo = new Todo();
        existingTodo.setText("Buy milk");
        existingTodo.setUser(owner);
    }

    @Test
    void deletesTodoByIdAndReturnsNoContent() throws Exception {
        given(repository.findById(1)).willReturn(Optional.of(existingTodo));

        mvc.perform(delete("/api/todos/1").with(MockUserFactory.jwtAs("user")))
                .andExpect(status().isNoContent());

        verify(repository).delete(existingTodo);
    }

    @Test
    void deletesAllTodosAndReturnsNoContent() throws Exception {
        mvc.perform(delete("/api/todos").with(MockUserFactory.jwtAs("user")))
                .andExpect(status().isNoContent());

        verify(repository).deleteAll();
    }
}
