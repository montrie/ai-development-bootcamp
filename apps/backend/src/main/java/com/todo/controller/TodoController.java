package com.todo.controller;

import com.todo.aspect.AuditAction;
import com.todo.model.AuditActionType;
import com.todo.model.Todo;
import com.todo.model.User;
import com.todo.repository.TodoRepository;
import com.todo.repository.UserRepository;
import com.todo.service.TodoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Tag(name = "Todos", description = "Manage the authenticated user's todo items")
@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoRepository repository;
    private final UserRepository userRepository;
    private final TodoService todoService;

    public TodoController(TodoRepository repository, UserRepository userRepository, TodoService todoService) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.todoService = todoService;
    }

    @Operation(summary = "Get all todos", description = "Returns all todo items for the authenticated user, ordered by the user's current sort mode")
    @ApiResponse(responseCode = "200", description = "List of todos")
    @GetMapping
    public List<Todo> getAllTodos() {
        User user = resolveUser();
        return todoService.getTodosForUser(user);
    }

    @Operation(summary = "Create a todo", description = "Creates a new todo item for the authenticated user")
    @ApiResponse(responseCode = "201", description = "Created todo")
    @ApiResponse(responseCode = "400", description = "Invalid input: missing text or malformed dueDate", content = @Content)
    @AuditAction(AuditActionType.TODO_CREATED)
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    @Transactional
    public Todo createTodo(@RequestBody CreateTodoRequest req) {
        if (req.text() == null || req.text().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "text must be a non-blank string");
        User user = resolveUser();
        Todo todo = new Todo();
        todo.setText(req.text());
        todo.setDueDate(req.dueDate());
        todo.setUser(user);
        Todo saved = repository.save(todo);

        if ("CUSTOM".equals(user.getSortMode())) {
            Long[] existing = user.getCustomOrder();
            Long[] updated = Arrays.copyOf(existing, existing.length + 1);
            updated[existing.length] = saved.getId();
            user.setCustomOrder(updated);
            userRepository.save(user);
        }

        return saved;
    }

    @Operation(summary = "Update todo", description = "Partially updates a todo item owned by the authenticated user")
    @ApiResponse(responseCode = "200", description = "Updated todo")
    @ApiResponse(responseCode = "400", description = "Invalid input: blank text, non-string text, or malformed dueDate", content = @Content)
    @ApiResponse(responseCode = "403", description = "Todo not found or belongs to another user", content = @Content)
    @AuditAction(AuditActionType.TODO_UPDATED)
    // Map<String, Object> is intentional: a typed record cannot distinguish an absent key from an
    // explicit null, which is required to support clearing dueDate with "dueDate": null.
    @PatchMapping("/{id}")
    public Todo updateTodo(
            @Parameter(description = "ID of the todo to update") @PathVariable Long id,
            @RequestBody Map<String, Object> patch) {
        String username = getAuthenticatedUsername();
        Todo todo = repository.findById(id)
                .filter(t -> t.getUser().getUsername().equals(username))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));

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

    @Operation(summary = "Delete a todo", description = "Permanently deletes a todo item owned by the authenticated user")
    @ApiResponse(responseCode = "204", description = "Deleted successfully")
    @ApiResponse(responseCode = "403", description = "Todo not found or belongs to another user")
    @AuditAction(AuditActionType.TODO_DELETED)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{id}")
    @Transactional
    public void deleteTodo(
            @Parameter(description = "ID of the todo to delete") @PathVariable Long id) {
        User user = resolveUser();
        Todo todo = repository.findById(id)
                .filter(t -> t.getUser().getUsername().equals(user.getUsername()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
        repository.delete(todo);
        userRepository.removeFromCustomOrder(user.getId(), id);
    }

    @Operation(summary = "Delete all todos", description = "Deletes every todo item in the database. Requires ADMIN role.")
    @ApiResponse(responseCode = "204", description = "All todos deleted")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping
    public void deleteAll() {
        repository.deleteAll();
    }

    @Operation(summary = "Reorder todos", description = "Sets CUSTOM sort mode and saves a new custom order for the authenticated user's todos")
    @ApiResponse(responseCode = "200", description = "Order updated")
    @ApiResponse(responseCode = "403", description = "One or more IDs are unknown or belong to another user", content = @Content)
    @PatchMapping("/reorder")
    @Transactional
    public void reorderTodos(@RequestBody ReorderRequest req) {
        User user = resolveUser();

        Set<Long> ownedIds = repository.findAllByUserOrderByCreatedAtAsc(user)
                .stream()
                .map(Todo::getId)
                .collect(Collectors.toSet());

        for (Long requestedId : req.order()) {
            if (!ownedIds.contains(requestedId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Todo ID not owned by user: " + requestedId);
            }
        }

        Long[] newOrder = req.order().toArray(new Long[0]);
        user.setSortMode("CUSTOM");
        user.setCustomOrder(newOrder);
        userRepository.save(user);
    }

    record CreateTodoRequest(String text, LocalDate dueDate) {}

    record ReorderRequest(List<Long> order) {}

    private User resolveUser() {
        return userRepository.findByUsername(getAuthenticatedUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
    }

    private String getAuthenticatedUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
