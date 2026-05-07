package com.todo.controller;

import com.todo.config.SecurityConfig;
import com.todo.repository.TodoRepository;
import com.todo.repository.UserRepository;
import com.todo.service.JwtService;
import com.todo.support.MockUserFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TodoController.class)
@Import(SecurityConfig.class)
class V3AdminTodoAccessTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    TodoRepository todoRepository;

    @MockitoBean
    UserRepository userRepository;

    @MockitoBean
    JwtService jwtService;

    @MockitoBean
    JwtDecoder jwtDecoder;

    @Test
    void adminCannotGetTodos() throws Exception {
        mvc.perform(get("/api/todos")
                        .with(MockUserFactory.jwtAsAdmin("admin")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCannotCreateTodo() throws Exception {
        mvc.perform(post("/api/todos")
                        .contentType("application/json")
                        .content("{\"text\":\"test\"}")
                        .with(MockUserFactory.jwtAsAdmin("admin")))
                .andExpect(status().isForbidden());
    }
}
