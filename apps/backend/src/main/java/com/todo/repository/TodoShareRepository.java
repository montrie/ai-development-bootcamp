package com.todo.repository;

import com.todo.model.TodoShare;
import com.todo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TodoShareRepository extends JpaRepository<TodoShare, Long> {

    boolean existsByTodoIdAndRecipientUserId(Long todoId, Long recipientUserId);

    List<TodoShare> findAllByRecipientUser(User user);

    void deleteByTodoIdAndRecipientUser(Long todoId, User recipientUser);
}
