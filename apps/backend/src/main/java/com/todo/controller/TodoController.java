package com.todo.controller;

import com.todo.model.Todo;
import com.todo.model.User;
import com.todo.repository.TodoRepository;
import com.todo.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Tag(name = "Todos", description = "Manage the authenticated user's todo items")
@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoRepository repository;
    private final UserRepository userRepository;

    public TodoController(TodoRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
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
    public Todo createTodo(@RequestBody Todo todo) {
        todo.setUser(resolveUser());
        return repository.save(todo);
    }

    @Operation(summary = "Update done state", description = "Toggles the done state of a todo item owned by the authenticated user")
    @ApiResponse(responseCode = "200", description = "Updated todo")
    @ApiResponse(responseCode = "403", description = "Todo not found or belongs to another user", content = @Content)
    @PatchMapping("/{id}")
    public Todo updateCompletedStatus(
            @Parameter(description = "ID of the todo to update") @PathVariable Integer id,
            @RequestBody Todo patch) {
        Todo todo = repository.findById(id)
                .filter(t -> t.getUser().getUsername().equals(getAuthenticatedUsername()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
        todo.setDone(patch.isDone());
        return repository.save(todo);
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

    private User resolveUser() {
        return userRepository.findByUsername(getAuthenticatedUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
    }

    private String getAuthenticatedUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
