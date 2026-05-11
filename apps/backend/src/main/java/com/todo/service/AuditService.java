package com.todo.service;

import com.todo.model.AuditLog;
import com.todo.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class AuditService {
    private final AuditLogRepository repo;

    public AuditService(AuditLogRepository repo) { this.repo = repo; }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String actionType, String actorUsername, String outcome, Long resourceId) {
        AuditLog entry = new AuditLog();
        entry.setTimestamp(OffsetDateTime.now());
        entry.setActionType(actionType);
        entry.setActorUsername(actorUsername);
        entry.setOutcome(outcome);
        entry.setResourceId(resourceId);
        repo.save(entry);
    }

    public List<AuditLog> search(String actionType, String actorUsername,
                                  OffsetDateTime startDate, OffsetDateTime endDate) {
        return repo.findWithFilters(actionType, actorUsername, startDate, endDate);
    }

    public void clearAll() { repo.deleteAll(); }

    public List<String> actionTypes() {
        return List.of(
            "TODO_CREATED", "TODO_TOGGLED", "TODO_DELETED",
            "USER_REGISTERED", "USER_LOGIN",
            "ADMIN_DELETE_USER", "ADMIN_RESET_PASSWORD",
            "ACCESS_DENIED"
        );
    }
}
