package com.todo.security;

import com.todo.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class AuditAccessDeniedHandler implements AccessDeniedHandler {
    private final AuditService auditService;

    public AuditAccessDeniedHandler(AuditService auditService) { this.auditService = auditService; }

    @Override
    public void handle(HttpServletRequest req, HttpServletResponse res,
                       AccessDeniedException ex) throws IOException {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        auditService.log("ACCESS_DENIED", username, "FAILURE", null);
        res.sendError(HttpServletResponse.SC_FORBIDDEN);
    }
}
