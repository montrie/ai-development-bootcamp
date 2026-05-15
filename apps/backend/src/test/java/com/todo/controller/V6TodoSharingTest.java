package com.todo.controller;

import com.todo.aspect.AuditAspect;
import com.todo.config.SecurityConfig;
import com.todo.model.AuditActionType;
import com.todo.model.Role;
import com.todo.model.Todo;
import com.todo.model.TodoShare;
import com.todo.model.User;
import com.todo.support.MockUserFactory;
import com.todo.support.TodoControllerTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.empty;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TodoController.class)
@Import({SecurityConfig.class, AuditAspect.class})
@EnableAspectJAutoProxy
class V6TodoSharingTest extends TodoControllerTestBase {

    private User owner;

    @BeforeEach
    void setUp() {
        owner = MockUserFactory.mockDefaultUser(userRepository);
    }

    private Todo todoOwnedBy(User user) {
        Todo todo = new Todo();
        todo.setText("Buy milk");
        todo.setUser(user);
        return todo;
    }

    private User userWithUsername(String username) {
        User u = new User();
        u.setUsername(username);
        u.setRole(Role.USER);
        return u;
    }

    private User adminWithUsername(String username) {
        User u = new User();
        u.setUsername(username);
        u.setRole(Role.ADMIN);
        return u;
    }

    // Test 1: POST /api/todos/shares with valid todoIds + recipientUsername → 200
    @Test
    void shareValidTodosWithExistingRecipient_returns200() throws Exception {
        Todo todo = spy(todoOwnedBy(owner));
        given(todo.getId()).willReturn(1L);

        User recipient = userWithUsername("alice");
        given(userRepository.findByUsername("alice")).willReturn(Optional.of(recipient));
        given(todoRepository.findById(1L)).willReturn(Optional.of(todo));
        given(todoShareRepository.existsByTodoIdAndRecipientUserId(any(), any())).willReturn(false);

        mvc.perform(post("/api/todos/shares")
                .with(MockUserFactory.jwtAs("user"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"todoIds\":[1],\"recipientUsername\":\"alice\"}"))
            .andExpect(status().isOk());
    }

    // Test 2: POST /api/todos/shares with unknown recipientUsername → 400, body contains "user does not exist"
    @Test
    void shareWithUnknownRecipient_returns400WithMessage() throws Exception {
        given(userRepository.findByUsername("unknownuser")).willReturn(Optional.empty());

        mvc.perform(post("/api/todos/shares")
                .with(MockUserFactory.jwtAs("user"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"todoIds\":[1],\"recipientUsername\":\"unknownuser\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(content().string(containsString("user does not exist")));
    }

    // Test 3: POST /api/todos/shares with self as recipient → 400, body contains "cannot share with user"
    @Test
    void shareWithSelfAsRecipient_returns400WithMessage() throws Exception {
        given(userRepository.findByUsername("user")).willReturn(Optional.of(owner));

        mvc.perform(post("/api/todos/shares")
                .with(MockUserFactory.jwtAs("user"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"todoIds\":[1],\"recipientUsername\":\"user\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(content().string(containsString("cannot share with user")));
    }

    // Test 4: POST /api/todos/shares with admin as recipient → 400, body contains "cannot share with user"
    @Test
    void shareWithAdminAsRecipient_returns400WithMessage() throws Exception {
        User admin = adminWithUsername("admin");
        given(userRepository.findByUsername("admin")).willReturn(Optional.of(admin));

        mvc.perform(post("/api/todos/shares")
                .with(MockUserFactory.jwtAs("user"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"todoIds\":[1],\"recipientUsername\":\"admin\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(content().string(containsString("cannot share with user")));
    }

    // Test 5: POST /api/todos/shares when already shared → 400, body contains "already shared with user"
    @Test
    void shareWhenAlreadyShared_returns400WithMessage() throws Exception {
        Todo todo = spy(todoOwnedBy(owner));
        given(todo.getId()).willReturn(1L);

        User recipient = userWithUsername("alice");
        given(userRepository.findByUsername("alice")).willReturn(Optional.of(recipient));
        given(todoRepository.findById(1L)).willReturn(Optional.of(todo));
        given(todoShareRepository.existsByTodoIdAndRecipientUserId(any(), any())).willReturn(true);

        mvc.perform(post("/api/todos/shares")
                .with(MockUserFactory.jwtAs("user"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"todoIds\":[1],\"recipientUsername\":\"alice\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(content().string(containsString("already shared with user")));
    }

    // Test 6: GET /api/todos returns shared todos with sharedBy field set to the owner's username.
    // Assertions use JSONPath filter expressions to avoid depending on response order.
    @Test
    void getAllTodosIncludesSharedTodosWithSharedByField() throws Exception {
        Todo ownTodo = todoOwnedBy(owner);
        ownTodo.setText("My own task");

        User bob = userWithUsername("bob");
        Todo sharedTodo = todoOwnedBy(bob);
        sharedTodo.setText("Team standup");

        TodoShare share = new TodoShare();
        share.setTodo(sharedTodo);
        share.setRecipientUser(owner);

        given(todoService.getTodosForUser(owner)).willReturn(List.of(ownTodo));
        given(todoShareRepository.findAllByRecipientUser(owner)).willReturn(List.of(share));

        mvc.perform(get("/api/todos").with(MockUserFactory.jwtAs("user")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[?(@.text == 'Team standup')].sharedBy", contains("bob")))
            .andExpect(jsonPath("$[?(@.text == 'My own task')].sharedBy", empty()));
    }

    // Test 7: POST /api/todos/shares with a todo owned by another user → 403
    @Test
    void shareATodoOwnedByAnotherUser_returns403() throws Exception {
        User bob = userWithUsername("bob");
        Todo bobsTodo = spy(todoOwnedBy(bob));
        given(bobsTodo.getId()).willReturn(99L);

        User alice = userWithUsername("alice");
        given(userRepository.findByUsername("alice")).willReturn(Optional.of(alice));
        given(todoRepository.findById(99L)).willReturn(Optional.of(bobsTodo));
        given(todoShareRepository.existsByTodoIdAndRecipientUserId(any(), any())).willReturn(false);

        mvc.perform(post("/api/todos/shares")
                .with(MockUserFactory.jwtAs("user"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"todoIds\":[99],\"recipientUsername\":\"alice\"}"))
            .andExpect(status().isForbidden());
    }

    // Test 8: DELETE /api/todos/{id}/share as a valid recipient → 204
    @Test
    void unshareTodo_asRecipient_returns204() throws Exception {
        given(todoShareRepository.existsByTodoIdAndRecipientUserId(1L, owner.getId())).willReturn(true);

        mvc.perform(delete("/api/todos/1/share").with(MockUserFactory.jwtAs("user")))
            .andExpect(status().isNoContent());

        verify(todoShareRepository).deleteByTodoIdAndRecipientUser(1L, owner);
    }

    // Test 9: DELETE /api/todos/{id}/share when todo is not shared with caller → 403
    @Test
    void unshareTodo_whenNotSharedWithCaller_returns403() throws Exception {
        given(todoShareRepository.existsByTodoIdAndRecipientUserId(1L, owner.getId())).willReturn(false);

        mvc.perform(delete("/api/todos/1/share").with(MockUserFactory.jwtAs("user")))
            .andExpect(status().isForbidden());
    }

    // Test 10: POST /api/todos/shares (success) → AuditService.log called once per todoId with TODO_SHARED
    @Test
    void shareSuccessfully_logsAuditEventPerTodoId() throws Exception {
        Todo todo1 = spy(todoOwnedBy(owner));
        given(todo1.getId()).willReturn(10L);
        Todo todo2 = spy(todoOwnedBy(owner));
        given(todo2.getId()).willReturn(20L);

        User recipient = userWithUsername("alice");
        given(userRepository.findByUsername("alice")).willReturn(Optional.of(recipient));
        given(todoRepository.findById(10L)).willReturn(Optional.of(todo1));
        given(todoRepository.findById(20L)).willReturn(Optional.of(todo2));
        given(todoShareRepository.existsByTodoIdAndRecipientUserId(any(), any())).willReturn(false);

        mvc.perform(post("/api/todos/shares")
                .with(MockUserFactory.jwtAs("user"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"todoIds\":[10,20],\"recipientUsername\":\"alice\"}"))
            .andExpect(status().isOk());

        verify(auditService).log(AuditActionType.TODO_SHARED, "user", "SUCCESS", 10L);
        verify(auditService).log(AuditActionType.TODO_SHARED, "user", "SUCCESS", 20L);
        verify(auditService, times(2)).log(any(AuditActionType.class), any(), any(), any());
    }
}
