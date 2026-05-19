package com.todo.repository;

import com.todo.model.TodoShare;
import com.todo.model.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface TodoShareRepository extends JpaRepository<TodoShare, Long> {

    boolean existsByTodoIdAndRecipientUserId(Long todoId, Long recipientUserId);

    // @EntityGraph overrides the fetch plan for this query only — Todo.user stays LAZY at the
    // entity mapping level, so other queries (e.g. TodoRepository.findAllByUserOrderByCreatedAtAsc)
    // are unaffected. Required because the GET /api/todos serializer dereferences
    // share.getTodo().getUser().getUsername() and would otherwise trigger N+1.
    @EntityGraph(attributePaths = {"todo", "todo.user"})
    List<TodoShare> findAllByRecipientUser(User user);

    // Imperative-equivalent of the @EntityGraph above. Kept for the V7 N+1 walkthrough so the
    // two ergonomics can be compared side by side; not used in production code. When to reach for
    // which: @EntityGraph is reusable across derived-method names and stays declarative; JOIN
    // FETCH is per-query, supports projections, and is the only option when the fetch plan needs
    // additional WHERE clauses or aliases beyond a path list.
    @Query("SELECT s FROM TodoShare s JOIN FETCH s.todo t JOIN FETCH t.user WHERE s.recipientUser = :user")
    List<TodoShare> findAllByRecipientUserJoinFetch(@Param("user") User user);

    // @Transactional is required here because derived delete methods are not covered by the
    // @Transactional declarations on SimpleJpaRepository's standard CRUD methods. Without it,
    // Spring's shared EntityManager refuses to issue the DELETE outside of an active transaction.
    @Transactional
    void deleteByTodoIdAndRecipientUser(Long todoId, User recipientUser);
}
