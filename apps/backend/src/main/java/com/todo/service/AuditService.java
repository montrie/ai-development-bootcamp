package com.todo.service;

import com.todo.model.AuditLog;
import com.todo.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(String actionType, String actorUsername, String outcome, Long resourceId) {
        AuditLog entry = new AuditLog();
        entry.setActionType(actionType);
        entry.setActorUsername(actorUsername);
        entry.setOutcome(outcome);
        entry.setResourceId(resourceId);
        auditLogRepository.save(entry);
    }
}
