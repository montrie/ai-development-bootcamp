package com.todo.repository;

import com.todo.model.Todo;
import com.todo.model.User;
import com.todo.support.IntegrationTestBase;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * EXPLAIN ANALYZE walkthrough for the native query
 *   SELECT * FROM todos WHERE user_id = ? ORDER BY array_position(?, id) NULLS LAST, created_at ASC
 *
 * The lesson visible on the plan: array_position is a per-row function call, so the sort key
 * cannot be precomputed by any normal index — Postgres scans rows for this user, then sorts on
 * a computed expression. See .tips/explain-analyze-postgres.md for the full reading.
 *
 * Asserts structural properties of the plan, not exact row counts: the top-level operator must
 * be a Sort, some node must reference the todos table, and the actual execution time must stay
 * under a generous bound to act as a regression guard without becoming flaky.
 */
@Transactional
class V7CustomOrderExplainTest extends IntegrationTestBase {

    private static final Logger log = LoggerFactory.getLogger(V7CustomOrderExplainTest.class);

    private static final int TOTAL_TODOS = 500;
    private static final int ORDERED_TODOS = 250;
    private static final long MAX_EXECUTION_TIME_MS = 250L;

    @Autowired
    UserRepository userRepository;

    @Autowired
    TodoRepository todoRepository;

    @PersistenceContext
    EntityManager entityManager;

    @Test
    void explainAnalyze_findAllByUserOrderByCustom_topNodeIsSortOverTodos() {
        User user = saveUser("explain-user");
        List<Long> todoIds = seedTodos(user, TOTAL_TODOS);

        List<Long> orderedIds = new ArrayList<>(todoIds.subList(0, ORDERED_TODOS));
        Collections.shuffle(orderedIds);

        entityManager.flush();
        entityManager.clear();

        String customOrderLiteral = orderedIds.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(",", "ARRAY[", "]::bigint[]"));
        String sql = "EXPLAIN (ANALYZE, FORMAT TEXT) " +
                "SELECT * FROM todos WHERE user_id = " + user.getId() +
                " ORDER BY array_position(" + customOrderLiteral + ", id) NULLS LAST, created_at ASC";

        @SuppressWarnings("unchecked")
        List<String> planLines = entityManager.createNativeQuery(sql).getResultList();
        String plan = String.join("\n", planLines);
        log.info("EXPLAIN ANALYZE plan for findAllByUserOrderByCustom:\n{}", plan);

        // The top-level node is whatever appears on the first line.
        assertThat(planLines.getFirst())
                .as("top-level operator should be a Sort (array_position forces a computed sort key)")
                .startsWith("Sort");

        assertThat(plan)
                .as("plan should access the todos table somewhere below the Sort")
                .contains("todos");

        long executionTimeMicros = parseExecutionTimeMicros(planLines);
        assertThat(executionTimeMicros)
                .as("execution time guard — flaky if too tight, useless if too loose")
                .isLessThan(MAX_EXECUTION_TIME_MS * 1000L);
    }

    private List<Long> seedTodos(User user, int count) {
        List<Long> ids = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            Todo todo = new Todo();
            todo.setText("explain-todo-" + i);
            todo.setUser(user);
            ids.add(todoRepository.save(todo).getId());
        }
        return ids;
    }

    private User saveUser(String username) {
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash("x");
        return userRepository.saveAndFlush(user);
    }

    // "Execution Time: 0.461 ms" — pulled from the last lines of an EXPLAIN ANALYZE text plan.
    // Returned in microseconds so the assertion bound can be a whole-millisecond integer.
    private static long parseExecutionTimeMicros(List<String> planLines) {
        for (String line : planLines) {
            String trimmed = line.trim();
            if (trimmed.startsWith("Execution Time:")) {
                String value = trimmed.substring("Execution Time:".length()).trim();
                value = value.replace(" ms", "").trim();
                double millis = Double.parseDouble(value);
                return Math.round(millis * 1000.0);
            }
        }
        throw new IllegalStateException("EXPLAIN ANALYZE output had no Execution Time line: " + planLines);
    }
}
