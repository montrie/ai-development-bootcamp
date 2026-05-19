package com.todo.repository;

import com.todo.model.Todo;
import com.todo.model.User;
import com.todo.support.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class V7TodoRepositoryTest extends IntegrationTestBase {

    @Autowired
    TodoRepository todoRepository;

    @Autowired
    UserRepository userRepository;

    @Test
    void findAllByUserOrderByCustom_ordersByArrayPositionWithUnknownIdsAppendedByCreatedAt() {
        User user = newUser("custom-order-user");
        userRepository.save(user);

        Todo alpha = saveTodo(user, "Alpha", null);
        Todo beta = saveTodo(user, "Beta", null);
        Todo gamma = saveTodo(user, "Gamma", null);
        Todo deltaNotInOrder = saveTodo(user, "Delta", null);

        Long[] customOrder = {gamma.getId(), alpha.getId(), beta.getId()};

        List<Todo> ordered = todoRepository.findAllByUserOrderByCustom(user.getId(), customOrder);

        assertThat(ordered).extracting(Todo::getId).containsExactly(
            gamma.getId(), alpha.getId(), beta.getId(), deltaNotInOrder.getId()
        );
    }

    @Test
    void findAllByUserOrderByDueDateAscCreatedAtAsc_placesNullDueDatesLast() {
        User user = newUser("due-date-user");
        userRepository.save(user);

        Todo earliest = saveTodo(user, "Earliest", LocalDate.of(2026, 1, 1));
        Todo latest = saveTodo(user, "Latest", LocalDate.of(2026, 12, 31));
        Todo noDate1 = saveTodo(user, "NoDate1", null);
        Todo noDate2 = saveTodo(user, "NoDate2", null);

        List<Todo> ordered = todoRepository.findAllByUserOrderByDueDateAscCreatedAtAsc(user);

        assertThat(ordered).extracting(Todo::getId).containsExactly(
            earliest.getId(), latest.getId(), noDate1.getId(), noDate2.getId()
        );
    }

    private User newUser(String username) {
        User u = new User();
        u.setUsername(username);
        u.setPasswordHash("x");
        return u;
    }

    private Todo saveTodo(User user, String text, LocalDate dueDate) {
        Todo todo = new Todo();
        todo.setText(text);
        todo.setUser(user);
        todo.setDueDate(dueDate);
        return todoRepository.saveAndFlush(todo);
    }
}
