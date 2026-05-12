package com.todo.repository;

import com.todo.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    @Query("""
        SELECT a FROM AuditLog a
        WHERE (:actionType IS NULL OR a.actionType = :actionType)
          AND (:actorUsername IS NULL OR a.actorUsername = :actorUsername)
          AND a.timestamp >= COALESCE(:startDate, a.timestamp)
          AND a.timestamp <= COALESCE(:endDate, a.timestamp)
        ORDER BY a.timestamp DESC
        """)
    List<AuditLog> findWithFilters(
        @Param("actionType") String actionType,
        @Param("actorUsername") String actorUsername,
        @Param("startDate") OffsetDateTime startDate,
        @Param("endDate") OffsetDateTime endDate
    );
}
