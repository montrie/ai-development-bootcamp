package com.todo.controller;

import com.todo.model.Todo;
import com.todo.model.User;
import com.todo.config.SecurityConfig;
import com.todo.support.MockUserFactory;
import com.todo.support.TodoControllerTestBase;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.Mockito;
import org.springframework.context.annotation.Import;
import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TodoController.class)
@Import(SecurityConfig.class)
class V2DeleteTodoTest extends TodoControllerTestBase {

    Todo existingTodo;

    @BeforeEach
    void setUp() throws Exception {
        User owner = new User();
        owner.setUsername("user");

        existingTodo = new Todo();
        existingTodo.setText("Buy milk");
        existingTodo.setUser(owner);

        Mockito.doAnswer(inv -> {
            HttpServletResponse resp = inv.getArgument(1);
            resp.setStatus(403);
            return null;
        }).when(auditAccessDeniedHandler).handle(any(), any(), any());
    }

    @Test
    void deletesTodoByIdAndReturnsNoContent() throws Exception {
        given(todoRepository.findById(1L)).willReturn(Optional.of(existingTodo));

        mvc.perform(delete("/api/todos/1").with(MockUserFactory.jwtAs("user")))
                .andExpect(status().isNoContent());

        verify(todoRepository).delete(existingTodo);
    }

    @Test
    void deleteAllAsUserReturnsForbidden() throws Exception {
        mvc.perform(delete("/api/todos").with(MockUserFactory.jwtAs("user")))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteAllAsAdminReturnsNoContent() throws Exception {
        mvc.perform(delete("/api/todos").with(MockUserFactory.jwtAsAdmin("admin")))
                .andExpect(status().isNoContent());

        verify(todoRepository).deleteAll();
    }
}
