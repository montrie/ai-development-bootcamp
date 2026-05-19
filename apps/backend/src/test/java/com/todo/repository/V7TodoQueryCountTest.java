package com.todo.repository;

import com.todo.model.Todo;
import com.todo.model.TodoShare;
import com.todo.model.User;
import com.todo.support.IntegrationTestBase;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.PersistenceUnit;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Demonstrates the N+1 problem in TodoController.getAllTodos's shared-todos branch
 * (TodoController.java:73-75) and asserts the post-fix query count.
 *
 * The controller does: share.getTodo().getUser().getUsername() — two lazy paths per share.
 *
 * Worst-case (every share has a distinct owner): 1 + 2n statements
 *   (1 share-list query + 1 Todo proxy init + 1 User proxy init per share).
 *
 * Our seed uses a *single* owner for all shares, so once the User is loaded once it stays in the
 * first-level cache for the rest of the loop. Actual shape: 1 + n + 1 = 5 with SHARE_COUNT=3.
 *
 * That the number depends on data topology is itself a learning: "N+1" is a family of shapes, and
 * an assertion on the JDBC statement count is more precise than the theoretical 1 + 2n.
 *
 * After the fix: 1 statement (single SELECT with the lazy paths pre-joined).
 */
@Transactional
class V7TodoQueryCountTest extends IntegrationTestBase {

    private static final int SHARE_COUNT = 3;

    @Autowired
    TodoRepository todoRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    TodoShareRepository todoShareRepository;

    @PersistenceUnit
    EntityManagerFactory emf;

    @PersistenceContext
    EntityManager em;

    private Statistics stats;
    private User recipient;

    @BeforeEach
    void seedSharesAndResetStats() {
        User owner = saveUser("owner");
        recipient = saveUser("recipient");

        for (int i = 0; i < SHARE_COUNT; i++) {
            Todo todo = new Todo();
            todo.setText("shared-" + i);
            todo.setUser(owner);
            todoRepository.save(todo);

            TodoShare share = new TodoShare();
            share.setTodo(todo);
            share.setRecipientUser(recipient);
            todoShareRepository.save(share);
        }

        // Flush + clear is what makes the N+1 measurable, and it deserves a paragraph because the
        // intent is non-obvious:
        //
        //   - flush() forces the pending INSERTs to hit the database now. Without this, the SELECT
        //     issued by findAllByRecipientUser would trigger an auto-flush, and the resulting
        //     INSERT statements would be counted by Statistics alongside the SELECTs we actually
        //     want to measure.
        //   - clear() evicts every entity from the first-level cache. Without this, the freshly
        //     saved Todo and User instances are still managed, so share.getTodo().getUser() is
        //     served from the persistence context — no lazy load fires, no SELECT, and the N+1
        //     simply does not happen in this test even though it absolutely does in production.
        //
        // Alternative (closer to production conditions): seed the data inside a *separate*
        // committed transaction (e.g. via TransactionTemplate or by splitting setup into a
        // non-transactional @BeforeAll), then read inside its own fresh transaction. That
        // reproduces the "request comes in cold, persistence context is empty" shape of a real
        // HTTP request more faithfully, but it costs us: the class can no longer rely on
        // @Transactional rollback, so we owe explicit cleanup (@AfterEach or a truncate), and the
        // setup becomes a multi-step affair. For a teaching test where the assertion *is* the
        // lesson, flush/clear is the more transparent option — it literally narrates "stop
        // buffering, throw away the cache, now measure" in two lines.
        em.flush();
        em.clear();

        stats = emf.unwrap(SessionFactory.class).getStatistics();
        stats.clear();
    }

    static Stream<Arguments> fetchStrategies() {
        // Two ergonomics, same outcome — the side-by-side comparison the V7 plan calls for.
        return Stream.of(
            Arguments.of("@EntityGraph",
                (Function<TodoShareRepository, Function<User, List<TodoShare>>>)
                    r -> r::findAllByRecipientUser),
            Arguments.of("JOIN FETCH",
                (Function<TodoShareRepository, Function<User, List<TodoShare>>>)
                    r -> r::findAllByRecipientUserJoinFetch)
        );
    }

    @ParameterizedTest(name = "{0} pulls shares + todo + owner in a single SELECT")
    @MethodSource("fetchStrategies")
    void fetchStrategy_collapsesNPlusOne_intoSingleStatement(
        String strategyName,
        Function<TodoShareRepository, Function<User, List<TodoShare>>> strategyFactory
    ) {
        Function<User, List<TodoShare>> strategy = strategyFactory.apply(todoShareRepository);

        List<TodoShare> shares = strategy.apply(recipient);

        // Reproduce the exact controller dereference that drives the N+1
        // (TodoController.java line 74: share.getTodo().getUser().getUsername()).
        // With either fetch strategy in place, this loop should issue zero additional SELECTs.
        for (TodoShare share : shares) {
            share.getTodo().getUser().getUsername();
        }

        // Use getPrepareStatementCount(), NOT getQueryExecutionCount(): the latter only counts
        // HQL/JPQL/native Query executions, so lazy loads — which go through the entity loader,
        // not the Query API — would be invisible. That distinction is itself a learning: the
        // metric you pick decides whether N+1 even shows up. PrepareStatementCount is the true
        // JDBC-level count and is the right number to assert on.
        long statements = stats.getPrepareStatementCount();
        assertThat(statements)
            .as("%s should resolve shares + todo + owner in one SELECT", strategyName)
            .isEqualTo(1L);
    }

    private User saveUser(String username) {
        User u = new User();
        u.setUsername(username);
        u.setPasswordHash("x");
        return userRepository.save(u);
    }
}
