package com.todo.controller;

import com.todo.config.SecurityConfig;
import com.todo.support.MockUserFactory;
import com.todo.support.TodoControllerTestBase;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TodoController.class)
@Import(SecurityConfig.class)
class V3AdminTodoAccessTest extends TodoControllerTestBase {

    @BeforeEach
    void setupSecurityMocks() throws Exception {
        Mockito.doAnswer(inv -> {
            HttpServletResponse resp = inv.getArgument(1);
            resp.setStatus(403);
            return null;
        }).when(auditAccessDeniedHandler).handle(any(), any(), any());
    }

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
