package com.todo.aspect;

import com.todo.model.AuditActionType;
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
        pointcut = "execution(* com.todo.controller.TodoController.createTodo(..))",
        returning = "result"
    )
    public void afterCreateTodo(Object result) {
        Todo todo = (Todo) result;
        auditService.log(AuditActionType.TODO_CREATED, actor(), "SUCCESS", todo.getId());
    }

    @AfterReturning(
        pointcut = "execution(* com.todo.controller.TodoController.updateTodo(..))",
        returning = "result"
    )
    public void afterUpdateTodo(Object result) {
        Todo todo = (Todo) result;
        auditService.log(AuditActionType.TODO_UPDATED, actor(), "SUCCESS", todo.getId());
    }

    @AfterReturning("execution(* com.todo.controller.TodoController.deleteTodo(..))")
    public void afterDeleteTodo(JoinPoint jp) {
        Long id = (Long) jp.getArgs()[0];
        auditService.log(AuditActionType.TODO_DELETED, actor(), "SUCCESS", id);
    }

    @AfterReturning("execution(* com.todo.controller.AdminController.deleteUser(..))")
    public void afterDeleteUser(JoinPoint jp) {
        Long id = (Long) jp.getArgs()[0];
        auditService.log(AuditActionType.ADMIN_DELETE_USER, actor(), "SUCCESS", id);
    }

    @AfterReturning("execution(* com.todo.controller.AdminController.resetPassword(..))")
    public void afterResetPassword(JoinPoint jp) {
        Long id = (Long) jp.getArgs()[0];
        auditService.log(AuditActionType.ADMIN_RESET_PASSWORD, actor(), "SUCCESS", id);
    }

    private String actor() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "unknown";
    }
}
