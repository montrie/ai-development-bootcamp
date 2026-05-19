package com.todo.repository;

import com.todo.model.User;
import com.todo.support.IntegrationTestBase;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class V7UserRepositoryTest extends IntegrationTestBase {

    @Autowired
    UserRepository userRepository;

    @PersistenceContext
    EntityManager entityManager;

    @Test
    void removeFromCustomOrder_stripsTargetIdAndKeepsTheRest() {
        User user = saveUserWithCustomOrder("array-remove-user", 10L, 20L, 30L, 40L);

        userRepository.removeFromCustomOrder(user.getId(), 20L);
        entityManager.refresh(user);

        assertThat(user.getCustomOrder()).containsExactly(10L, 30L, 40L);
    }

    @Test
    void removeFromCustomOrder_isNoOpWhenIdNotPresent() {
        User user = saveUserWithCustomOrder("array-remove-missing-user", 1L, 2L, 3L);

        userRepository.removeFromCustomOrder(user.getId(), 999L);
        entityManager.refresh(user);

        assertThat(user.getCustomOrder()).containsExactly(1L, 2L, 3L);
    }

    private User saveUserWithCustomOrder(String username, Long... customOrder) {
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash("x");
        user.setCustomOrder(customOrder);
        return userRepository.saveAndFlush(user);
    }
}
