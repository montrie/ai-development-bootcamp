package com.todo.repository;

import com.todo.model.Todo;
import com.todo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TodoRepository extends JpaRepository<Todo, Long> {

    List<Todo> findAllByOrderByCreatedAtAsc();

    List<Todo> findAllByUserOrderByCreatedAtAsc(User user);

    List<Todo> findAllByUserOrderByCreatedAtDesc(User user);

    List<Todo> findAllByUserOrderByTextAsc(User user);

    List<Todo> findAllByUserOrderByTextDesc(User user);

    @Query("SELECT t FROM Todo t WHERE t.user = :user ORDER BY t.dueDate ASC NULLS LAST, t.createdAt ASC")
    List<Todo> findAllByUserOrderByDueDateAscCreatedAtAsc(@Param("user") User user);

    @Query("SELECT t FROM Todo t WHERE t.user = :user ORDER BY t.dueDate DESC NULLS LAST, t.createdAt ASC")
    List<Todo> findAllByUserOrderByDueDateDescCreatedAtAsc(@Param("user") User user);

    @Query(value = "SELECT * FROM todos WHERE user_id = :userId ORDER BY array_position(:customOrder, id) NULLS LAST, created_at ASC", nativeQuery = true)
    List<Todo> findAllByUserOrderByCustom(@Param("userId") Long userId, @Param("customOrder") Long[] customOrder);
}
