package com.todo.controller;

import com.todo.model.Todo;
import com.todo.model.User;
import com.todo.repository.TodoRepository;
import com.todo.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoRepository repository;
    private final UserRepository userRepository;

    public TodoController(TodoRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Todo> getAllTodos() {
        User user = resolveUser();
        return repository.findAllByUserOrderByCreatedAtAsc(user);
    }

    @PostMapping
    public Todo createTodo(@RequestBody Todo todo) {
        todo.setUser(resolveUser());
        return repository.save(todo);
    }

    @PatchMapping("/{id}")
    public Todo updateCompletedStatus(@PathVariable Integer id, @RequestBody Todo patch) {
        Todo todo = repository.findById(id)
                .filter(t -> t.getUser().getUsername().equals(getAuthenticatedUsername()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
        todo.setDone(patch.isDone());
        return repository.save(todo);
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{id}")
    public void deleteTodo(@PathVariable Integer id) {
        Todo todo = repository.findById(id)
                .filter(t -> t.getUser().getUsername().equals(getAuthenticatedUsername()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
        repository.delete(todo);
    }

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
