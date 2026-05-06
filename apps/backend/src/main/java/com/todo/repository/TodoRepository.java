package com.todo.repository;

import com.todo.model.Todo;
import com.todo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TodoRepository extends JpaRepository<Todo, Integer> {

    List<Todo> findAllByOrderByCreatedAtAsc();

    List<Todo> findAllByUserOrderByCreatedAtAsc(User user);
}
