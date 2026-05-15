package com.todo.controller;

import com.todo.aspect.AuditAction;
import com.todo.model.AuditActionType;
import com.todo.model.Role;
import com.todo.model.Todo;
import com.todo.model.TodoShare;
import com.todo.model.User;
import com.todo.repository.TodoRepository;
import com.todo.repository.TodoShareRepository;
import com.todo.repository.UserRepository;
import com.todo.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Tag(name = "Todos", description = "Manage the authenticated user's todo items")
@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoRepository repository;
    private final TodoShareRepository todoShareRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public TodoController(TodoRepository repository,
                          TodoShareRepository todoShareRepository,
                          UserRepository userRepository,
                          AuditService auditService) {
        this.repository = repository;
        this.todoShareRepository = todoShareRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Operation(summary = "Get all todos", description = "Returns all todo items for the authenticated user, ordered by creation time")
    @ApiResponse(responseCode = "200", description = "List of todos")
    @GetMapping
    public List<TodoResponseDto> getAllTodos() {
        User user = resolveUser();

        List<TodoResponseDto> result = new ArrayList<>();

        repository.findAllByUserOrderByCreatedAtAsc(user)
                .forEach(t -> result.add(new TodoResponseDto(t, null)));

        todoShareRepository.findAllByRecipientUser(user)
                .forEach(share -> result.add(
                        new TodoResponseDto(share.getTodo(), share.getTodo().getUser().getUsername())
                ));

        result.sort(Comparator.comparing(
                dto -> dto.getCreatedAt() != null ? dto.getCreatedAt() : java.time.OffsetDateTime.MIN
        ));

        return result;
    }

    @Operation(summary = "Create a todo", description = "Creates a new todo item for the authenticated user")
    @ApiResponse(responseCode = "201", description = "Created todo")
    @ApiResponse(responseCode = "400", description = "Invalid input: missing text or malformed dueDate", content = @Content)
    @AuditAction(AuditActionType.TODO_CREATED)
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public Todo createTodo(@RequestBody CreateTodoRequest req) {
        if (req.text() == null || req.text().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "text must be a non-blank string");
        User user = resolveUser();
        Todo todo = new Todo();
        todo.setText(req.text());
        todo.setDueDate(req.dueDate());
        todo.setUser(user);
        return repository.save(todo);
    }

    @Operation(summary = "Update todo", description = "Partially updates a todo item owned by or shared with the authenticated user")
    @ApiResponse(responseCode = "200", description = "Updated todo")
    @ApiResponse(responseCode = "400", description = "Invalid input: blank text, non-string text, or malformed dueDate", content = @Content)
    @ApiResponse(responseCode = "403", description = "Todo not found or not accessible by this user", content = @Content)
    @AuditAction(AuditActionType.TODO_UPDATED)
    // Map<String, Object> is intentional: a typed record cannot distinguish an absent key from an
    // explicit null, which is required to support clearing dueDate with "dueDate": null.
    @PatchMapping("/{id}")
    public Todo updateTodo(
            @Parameter(description = "ID of the todo to update") @PathVariable Long id,
            @RequestBody Map<String, Object> patch) {
        String username = getAuthenticatedUsername();
        Todo todo = findAccessibleTodo(id, username);

        if (patch.containsKey("done")) {
            todo.setDone(Boolean.TRUE.equals(patch.get("done")));
        }

        if (patch.containsKey("text")) {
            Object rawText = patch.get("text");
            if (!(rawText instanceof String text) || text.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "text must be a non-blank string");
            }
            todo.setText(text);
        }

        if (patch.containsKey("dueDate")) {
            Object rawDueDate = patch.get("dueDate");
            if (rawDueDate != null && !(rawDueDate instanceof String)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dueDate must be an ISO date string or null");
            }
            try {
                todo.setDueDate(rawDueDate == null ? null : LocalDate.parse((String) rawDueDate));
            } catch (java.time.format.DateTimeParseException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dueDate must be a valid ISO date (yyyy-MM-dd)");
            }
        }

        return repository.save(todo);
    }

    @Operation(summary = "Delete a todo", description = "Deletes a todo. Owner deletes the todo permanently; recipient removes the share.")
    @ApiResponse(responseCode = "204", description = "Deleted successfully")
    @ApiResponse(responseCode = "403", description = "Todo not found or not accessible by this user")
    @AuditAction(AuditActionType.TODO_DELETED)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{id}")
    public void deleteTodo(
            @Parameter(description = "ID of the todo to delete") @PathVariable Long id) {
        String username = getAuthenticatedUsername();
        Todo todo = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));

        if (todo.getUser().getUsername().equals(username)) {
            repository.delete(todo);
        } else {
            User user = resolveUser();
            if (!todoShareRepository.existsByTodoIdAndRecipientUserId(id, user.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
            todoShareRepository.deleteByTodoIdAndRecipientUser(id, user);
        }
    }

    @Operation(summary = "Delete all todos", description = "Deletes every todo item in the database. Requires ADMIN role.")
    @ApiResponse(responseCode = "204", description = "All todos deleted")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping
    public void deleteAll() {
        repository.deleteAll();
    }

    @Operation(summary = "Share todos", description = "Shares one or more todos with another user")
    @ApiResponse(responseCode = "200", description = "Todos shared successfully")
    @ApiResponse(responseCode = "400", description = "Invalid recipient or share already exists")
    @PostMapping("/shares")
    public ResponseEntity<String> shareTodos(@RequestBody ShareTodosRequest req) {
        String actorUsername = getAuthenticatedUsername();

        Optional<User> recipientOpt = userRepository.findByUsername(req.recipientUsername());
        if (recipientOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("user does not exist");
        }

        User recipient = recipientOpt.get();

        if (recipient.getUsername().equals(actorUsername) || recipient.getRole() == Role.ADMIN) {
            return ResponseEntity.badRequest().body("cannot share with user");
        }

        for (Long todoId : req.todoIds()) {
            if (todoShareRepository.existsByTodoIdAndRecipientUserId(todoId, recipient.getId())) {
                return ResponseEntity.badRequest().body("already shared with user");
            }
        }

        for (Long todoId : req.todoIds()) {
            Todo todo = repository.findById(todoId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            TodoShare share = new TodoShare();
            share.setTodo(todo);
            share.setRecipientUser(recipient);
            todoShareRepository.save(share);
            auditService.log(AuditActionType.TODO_SHARED, actorUsername, "SUCCESS", todoId);
        }

        return ResponseEntity.ok().build();
    }

    record CreateTodoRequest(String text, LocalDate dueDate) {}

    record ShareTodosRequest(List<Long> todoIds, String recipientUsername) {}

    private User resolveUser() {
        return userRepository.findByUsername(getAuthenticatedUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
    }

    private String getAuthenticatedUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    /**
     * Finds a todo accessible to the given user: either owned by them or shared with them.
     * Throws 403 if not found or not accessible.
     */
    private Todo findAccessibleTodo(Long id, String username) {
        Todo todo = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));

        if (todo.getUser().getUsername().equals(username)) {
            return todo;
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));

        if (todoShareRepository.existsByTodoIdAndRecipientUserId(id, user.getId())) {
            return todo;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
}
