package com.todo.repository;

import com.todo.support.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

class V7FlywayMigrationsTest extends IntegrationTestBase {

    @Autowired
    JdbcTemplate jdbcTemplate;

    @Test
    void everyMigrationOnClasspathIsRecordedSuccessfully() throws Exception {
        List<String> classpathVersions = discoverClasspathMigrationVersions();

        List<String> appliedVersions = jdbcTemplate.queryForList(
            "SELECT version FROM flyway_schema_history WHERE success = true AND version IS NOT NULL ORDER BY installed_rank",
            String.class
        );

        assertThat(appliedVersions).containsExactlyElementsOf(classpathVersions);
    }

    private List<String> discoverClasspathMigrationVersions() throws Exception {
        Resource[] resources = new PathMatchingResourcePatternResolver()
            .getResources("classpath:db/migration/V*__*.sql");
        return Arrays.stream(resources)
            .map(Resource::getFilename)
            .map(name -> name.substring(1, name.indexOf("__")))
            .sorted()
            .collect(Collectors.toList());
    }
}
