package com.todo.repository;

import com.todo.model.Role;
import com.todo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByRole(Role role);

    List<User> findByRole(Role role);

    // flushAutomatically pushes any pending writes in this transaction's persistence context to
    // the DB before the native UPDATE runs; clearAutomatically detaches every entity (of every
    // type) currently managed by this Hibernate session afterwards, so a later findById in the
    // same transaction re-reads from the DB instead of serving the stale pre-update User from
    // the first-level cache. Existing reference variables stay pointing at detached instances
    // with their pre-update field values — call sites must re-read via findById to observe the
    // change. Trade-off: callers that relied on a hot first-level cache later in the same tx
    // lose it. Surgical alternative is entityManager.refresh(user) at each call site —
    // see docs/future-concepts.md:137.
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "UPDATE users SET custom_order = array_remove(custom_order, :todoId) WHERE id = :userId", nativeQuery = true)
    void removeFromCustomOrder(@Param("userId") Long userId, @Param("todoId") Long todoId);

}
