package com.todo.service;

import com.todo.model.Todo;
import com.todo.model.User;
import com.todo.repository.TodoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TodoService {

    private final TodoRepository todoRepository;

    public TodoService(TodoRepository todoRepository) {
        this.todoRepository = todoRepository;
    }

    public List<Todo> getTodosForUser(User user) {
        return switch (user.getSortMode()) {
            case "CREATED_DESC" -> todoRepository.findAllByUserOrderByCreatedAtDesc(user);
            case "ALPHA_ASC"    -> todoRepository.findAllByUserOrderByTextAsc(user);
            case "ALPHA_DESC"   -> todoRepository.findAllByUserOrderByTextDesc(user);
            case "DUE_DATE_EARLIEST_FIRST" -> todoRepository.findAllByUserOrderByDueDateAscCreatedAtAsc(user);
            case "DUE_DATE_LATEST_FIRST"  -> todoRepository.findAllByUserOrderByDueDateDescCreatedAtAsc(user);
            case "CUSTOM"       -> todoRepository.findAllByUserOrderByCustom(user.getId(), user.getCustomOrder());
            default             -> todoRepository.findAllByUserOrderByCreatedAtAsc(user);
        };
    }
}
