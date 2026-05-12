package com.todo.controller;

import com.todo.model.Todo;
import com.todo.model.User;
import com.todo.repository.TodoRepository;
import com.todo.repository.UserRepository;
import com.todo.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Tag(name = "Todos", description = "Manage the authenticated user's todo items")
@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoRepository repository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public TodoController(TodoRepository repository, UserRepository userRepository, AuditService auditService) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Operation(summary = "Get all todos", description = "Returns all todo items for the authenticated user, ordered by creation time")
    @ApiResponse(responseCode = "200", description = "List of todos")
    @GetMapping
    public List<Todo> getAllTodos() {
        User user = resolveUser();
        return repository.findAllByUserOrderByCreatedAtAsc(user);
    }

    @Operation(summary = "Create a todo", description = "Creates a new todo item for the authenticated user")
    @ApiResponse(responseCode = "201", description = "Created todo")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public Todo createTodo(@RequestBody CreateTodoRequest req) {
        User user = resolveUser();
        Todo todo = new Todo();
        todo.setText(req.text());
        if (req.dueDate() != null) {
            todo.setDueDate(LocalDate.parse(req.dueDate()));
        }
        todo.setUser(user);
        Todo saved = repository.save(todo);
        auditService.log("TODO_CREATED", user.getUsername(), "SUCCESS", saved.getId() == null ? null : saved.getId().longValue());
        return saved;
    }

    @Operation(summary = "Update todo", description = "Partially updates a todo item owned by the authenticated user")
    @ApiResponse(responseCode = "200", description = "Updated todo")
    @ApiResponse(responseCode = "400", description = "Blank text provided", content = @Content)
    @ApiResponse(responseCode = "403", description = "Todo not found or belongs to another user", content = @Content)
    @PatchMapping("/{id}")
    public Todo updateTodo(
            @Parameter(description = "ID of the todo to update") @PathVariable Integer id,
            @RequestBody Map<String, Object> patch) {
        String username = getAuthenticatedUsername();
        Todo todo = repository.findById(id)
                .filter(t -> t.getUser().getUsername().equals(username))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));

        boolean edited = false;

        if (patch.containsKey("done")) {
            todo.setDone(Boolean.TRUE.equals(patch.get("done")));
        }

        if (patch.containsKey("text")) {
            String text = (String) patch.get("text");
            if (text == null || text.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "text must not be blank");
            }
            todo.setText(text);
            edited = true;
        }

        if (patch.containsKey("dueDate")) {
            Object rawDueDate = patch.get("dueDate");
            todo.setDueDate(rawDueDate == null ? null : LocalDate.parse((String) rawDueDate));
            edited = true;
        }

        Todo saved = repository.save(todo);

        if (edited) {
            auditService.log("TODO_EDITED", username, "SUCCESS", saved.getId() == null ? null : saved.getId().longValue());
        }

        return saved;
    }

    @Operation(summary = "Delete a todo", description = "Permanently deletes a todo item owned by the authenticated user")
    @ApiResponse(responseCode = "204", description = "Deleted successfully")
    @ApiResponse(responseCode = "403", description = "Todo not found or belongs to another user")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{id}")
    public void deleteTodo(
            @Parameter(description = "ID of the todo to delete") @PathVariable Integer id) {
        Todo todo = repository.findById(id)
                .filter(t -> t.getUser().getUsername().equals(getAuthenticatedUsername()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
        repository.delete(todo);
    }

    @Operation(summary = "Delete all todos", description = "Deletes every todo item in the database. Requires ADMIN role.")
    @ApiResponse(responseCode = "204", description = "All todos deleted")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping
    public void deleteAll() {
        repository.deleteAll();
    }

    record CreateTodoRequest(String text, String dueDate) {}

    private User resolveUser() {
        return userRepository.findByUsername(getAuthenticatedUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
    }

    private String getAuthenticatedUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
