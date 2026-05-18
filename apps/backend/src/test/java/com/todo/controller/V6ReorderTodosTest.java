package com.todo.controller;

import com.todo.config.SecurityConfig;
import com.todo.model.SortMode;
import com.todo.model.Todo;
import com.todo.model.User;
import com.todo.support.MockUserFactory;
import com.todo.support.TodoControllerTestBase;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TodoController.class)
@Import(SecurityConfig.class)
class V6ReorderTodosTest extends TodoControllerTestBase {

    User owner;
    Todo todo1;
    Todo todo2;
    Todo todo3;

    @BeforeEach
    void setUp() throws Exception {
        owner = new User();
        owner.setUsername("user");
        owner.setSortMode(SortMode.CREATED_ASC);
        owner.setCustomOrder(new Long[]{});

        todo1 = new Todo();
        todo1.setText("Alpha");
        todo1.setUser(owner);

        todo2 = new Todo();
        todo2.setText("Beta");
        todo2.setUser(owner);

        todo3 = new Todo();
        todo3.setText("Gamma");
        todo3.setUser(owner);

        given(userRepository.findByUsername("user")).willReturn(Optional.of(owner));
        given(userRepository.save(any(User.class))).willAnswer(inv -> inv.getArgument(0));
        given(todoRepository.findAllByUserOrderByCreatedAtAsc(owner)).willReturn(List.of(todo1, todo2, todo3));

        Mockito.doAnswer(inv -> {
            HttpServletResponse resp = inv.getArgument(1);
            resp.setStatus(401);
            return null;
        }).when(auditAuthenticationEntryPoint).commence(any(), any(), any());
    }

    @Test
    void reorderWithAllOwnedIdsReturns200() throws Exception {
        given(todoRepository.findAllByUserOrderByCreatedAtAsc(owner)).willReturn(List.of(todo1, todo2, todo3));

        mvc.perform(patch("/api/todos/reorder")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"order\":[]}"))
                .andExpect(status().isOk());
    }

    @Test
    void reorderWithForeignIdReturns403() throws Exception {
        given(todoRepository.findAllByUserOrderByCreatedAtAsc(owner)).willReturn(List.of(todo1, todo2));

        mvc.perform(patch("/api/todos/reorder")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"order\":[999999999]}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void reorderWithNonExistentIdReturns403() throws Exception {
        given(todoRepository.findAllByUserOrderByCreatedAtAsc(owner)).willReturn(List.of(todo1));

        mvc.perform(patch("/api/todos/reorder")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"order\":[999999999]}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void reorderWithoutAuthReturns401() throws Exception {
        mvc.perform(patch("/api/todos/reorder")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"order\":[1,2,3]}"))
                .andExpect(status().isUnauthorized());
    }
}
