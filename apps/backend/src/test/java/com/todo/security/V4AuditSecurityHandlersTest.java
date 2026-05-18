package com.todo.security;

import com.todo.model.AuditActionType;
import com.todo.model.Outcome;
import com.todo.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;

import static org.mockito.Mockito.*;

class V4AuditSecurityHandlersTest {

    private final AuditService auditService = mock(AuditService.class);
    private final AuditAuthenticationEntryPoint entryPoint = new AuditAuthenticationEntryPoint(auditService);
    private final AuditAccessDeniedHandler accessDeniedHandler = new AuditAccessDeniedHandler(auditService);
    private final HttpServletRequest request = mock(HttpServletRequest.class);
    private final HttpServletResponse response = mock(HttpServletResponse.class);

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticationEntryPointLogsUnauthenticatedForAnonymousAndSends401() throws IOException {
        entryPoint.commence(request, response, new BadCredentialsException("bad"));

        verify(auditService).log(AuditActionType.UNAUTHENTICATED, "anonymous", Outcome.FAILURE, null);
        verify(response).sendError(HttpServletResponse.SC_UNAUTHORIZED);
    }

    @Test
    void accessDeniedHandlerLogsAccessDeniedForAuthenticatedUserAndSends403() throws IOException {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("alice");
        SecurityContextHolder.getContext().setAuthentication(auth);

        accessDeniedHandler.handle(request, response, new AccessDeniedException("denied"));

        verify(auditService).log(AuditActionType.ACCESS_DENIED, "alice", Outcome.FAILURE, null);
        verify(response).sendError(HttpServletResponse.SC_FORBIDDEN);
    }

    @Test
    void accessDeniedHandlerLogsUnknownWhenNoAuthenticationPresent() throws IOException {
        accessDeniedHandler.handle(request, response, new AccessDeniedException("denied"));

        verify(auditService).log(AuditActionType.ACCESS_DENIED, "unknown", Outcome.FAILURE, null);
        verify(response).sendError(HttpServletResponse.SC_FORBIDDEN);
    }
}
