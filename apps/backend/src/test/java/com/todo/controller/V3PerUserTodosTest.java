package com.todo.controller;

import com.todo.model.Todo;
import com.todo.model.User;
import com.todo.repository.TodoRepository;
import com.todo.repository.UserRepository;
import com.todo.service.JwtService;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import com.todo.config.SecurityConfig;
import com.todo.support.MockUserFactory;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Import;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TodoController.class)
@Import(SecurityConfig.class)
class V3PerUserTodosTest {

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

    @Test
    void getAllTodosReturnsOnlyAuthenticatedUsersItems() throws Exception {
        User alice = new User();
        alice.setUsername("alice");

        Todo aliceTodo = new Todo();
        aliceTodo.setText("Alice task");

        given(userRepository.findByUsername("alice")).willReturn(Optional.of(alice));
        given(repository.findAllByUserOrderByCreatedAtAsc(alice)).willReturn(List.of(aliceTodo));

        mvc.perform(get("/api/todos").with(MockUserFactory.jwtAs("alice")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].text").value("Alice task"))
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void deleteAnotherUsersTodoReturns403() throws Exception {
        User bob = new User();
        bob.setUsername("bob");

        Todo bobTodo = new Todo();
        bobTodo.setUser(bob);

        given(repository.findById(1)).willReturn(Optional.of(bobTodo));

        mvc.perform(delete("/api/todos/1").with(MockUserFactory.jwtAs("alice")))
                .andExpect(status().isForbidden());
    }

    @Test
    void accessNonExistentTodoReturns403() throws Exception {
        given(repository.findById(999999)).willReturn(Optional.empty());

        mvc.perform(patch("/api/todos/999999")
                        .with(MockUserFactory.jwtAs("alice"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"done\":true}"))
                .andExpect(status().isForbidden());
    }
}
