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

    @Modifying
    @Query(value = "UPDATE users SET custom_order = array_remove(custom_order, :todoId) WHERE id = :userId", nativeQuery = true)
    void removeFromCustomOrder(@Param("userId") Long userId, @Param("todoId") Long todoId);

    @Modifying
    @Query(value = "UPDATE users SET sort_mode = :sortMode, custom_order = :customOrder WHERE id = :userId", nativeQuery = true)
    void updateSortModeAndCustomOrder(@Param("userId") Long userId, @Param("sortMode") String sortMode, @Param("customOrder") Long[] customOrder);
}
