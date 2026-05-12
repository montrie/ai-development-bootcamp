package com.todo.security;

import com.todo.model.AuditActionType;
import com.todo.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class AuditAuthenticationEntryPoint implements AuthenticationEntryPoint {
    private final AuditService auditService;

    public AuditAuthenticationEntryPoint(AuditService auditService) { this.auditService = auditService; }

    @Override
    public void commence(HttpServletRequest req, HttpServletResponse res,
                         AuthenticationException ex) throws IOException {
        auditService.log(AuditActionType.UNAUTHENTICATED, "anonymous", "FAILURE", null);
        res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
    }
}
