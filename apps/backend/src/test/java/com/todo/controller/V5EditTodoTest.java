package com.todo.controller;

import com.todo.config.SecurityConfig;
import com.todo.model.Todo;
import com.todo.model.User;
import com.todo.repository.TodoRepository;
import com.todo.repository.UserRepository;
import com.todo.service.AuditService;
import com.todo.service.JwtService;
import com.todo.support.MockUserFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TodoController.class)
@Import(SecurityConfig.class)
class V5EditTodoTest {

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

    @MockitoBean
    AuditService auditService;

    Todo existing;

    @BeforeEach
    void setUp() {
        User owner = new User();
        owner.setUsername("user");

        existing = new Todo();
        existing.setText("Old text");
        existing.setUser(owner);

        given(repository.findById(1)).willReturn(Optional.of(existing));
        given(repository.save(any(Todo.class))).willAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void patchWithTextUpdatesTextAndPreservesDoneState() throws Exception {
        existing.setDone(true);

        mvc.perform(patch("/api/todos/1")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"New text\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("New text"))
                .andExpect(jsonPath("$.done").value(true));
    }

    @Test
    void patchWithDueDateSetsDueDate() throws Exception {
        mvc.perform(patch("/api/todos/1")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dueDate\":\"2027-06-15\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueDate").value("2027-06-15"));
    }

    @Test
    void patchWithExplicitNullDueDateClearsDueDate() throws Exception {
        existing.setDueDate(LocalDate.of(2027, 6, 15));

        mvc.perform(patch("/api/todos/1")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dueDate\":null}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueDate").isEmpty());
    }

    @Test
    void patchOmittingDueDateLeavesItUnchanged() throws Exception {
        existing.setDueDate(LocalDate.of(2027, 6, 15));

        mvc.perform(patch("/api/todos/1")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"done\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueDate").value("2027-06-15"));
    }

    @Test
    void patchWithBlankTextReturns400() throws Exception {
        mvc.perform(patch("/api/todos/1")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"   \"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void patchWithTextOrDueDateWritesAuditLogEntry() throws Exception {
        mvc.perform(patch("/api/todos/1")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"Updated text\"}"))
                .andExpect(status().isOk());

        verify(auditService).log(eq("TODO_EDITED"), eq("user"), eq("SUCCESS"), any());
    }

    @Test
    void patchWithOnlyDoneDoesNotWriteAuditLogEntry() throws Exception {
        mvc.perform(patch("/api/todos/1")
                        .with(MockUserFactory.jwtAs("user"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"done\":true}"))
                .andExpect(status().isOk());

        verifyNoInteractions(auditService);
    }
}
