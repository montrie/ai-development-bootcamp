package com.todo.aspect;

import com.todo.model.Todo;
import com.todo.service.AuditService;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class AuditAspect {
    private final AuditService auditService;

    public AuditAspect(AuditService auditService) { this.auditService = auditService; }

    @AfterReturning(
        pointcut = "@annotation(auditAction)",
        returning = "result"
    )
    public void afterAuditedMethod(JoinPoint jp, AuditAction auditAction, Object result) {
        Long resourceId;
        if (result instanceof Todo t) {
            resourceId = t.getId();
        } else if (jp.getArgs().length > 0 && jp.getArgs()[0] instanceof Long id) {
            resourceId = id;
        } else {
            resourceId = null;
        }
        auditService.log(auditAction.value(), actor(), "SUCCESS", resourceId);
    }

    private String actor() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "unknown";
    }
}
