package com.todo.repository;

import com.todo.model.TodoShare;
import com.todo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface TodoShareRepository extends JpaRepository<TodoShare, Long> {

    boolean existsByTodoIdAndRecipientUserId(Long todoId, Long recipientUserId);

    List<TodoShare> findAllByRecipientUser(User user);

    // @Transactional is required here because derived delete methods are not covered by the
    // @Transactional declarations on SimpleJpaRepository's standard CRUD methods. Without it,
    // Spring's shared EntityManager refuses to issue the DELETE outside of an active transaction.
    @Transactional
    void deleteByTodoIdAndRecipientUser(Long todoId, User recipientUser);
}
