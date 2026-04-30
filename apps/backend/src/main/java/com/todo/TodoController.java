package com.todo;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoRepository repository;

    public TodoController(TodoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Todo> getAllTodos() {
        return repository.findAllByOrderByCreatedAtAsc();
    }

    @PostMapping
    public Todo createTodo(@RequestBody Todo todo) {
        return repository.save(todo);
    }

    @PatchMapping("/{id}")
    public Todo updateCompletedStatus(@PathVariable Integer id, @RequestBody Todo patch) {
        Todo todo = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        todo.setDone(patch.isDone());
        return repository.save(todo);
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{id}")
    public void deleteTodo(@PathVariable Integer id) {
        repository.deleteById(id);
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping
    public void deleteAll() {
        repository.deleteAll();
    }
}
