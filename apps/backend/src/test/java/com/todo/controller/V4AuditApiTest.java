package com.todo.controller;

import com.todo.config.SecurityConfig;
import com.todo.model.AuditActionType;
import com.todo.model.AuditLog;
import com.todo.model.Outcome;
import com.todo.security.AuditAccessDeniedHandler;
import com.todo.security.AuditAuthenticationEntryPoint;
import com.todo.service.AuditService;
import com.todo.service.JwtService;
import com.todo.service.UserService;
import com.todo.support.MockUserFactory;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AdminController.class)
@Import(SecurityConfig.class)
class V4AuditApiTest {

    @Autowired MockMvc mvc;

    @MockitoBean UserService userService;
    @MockitoBean AuditService auditService;
    @MockitoBean JwtService jwtService;
    @MockitoBean JwtDecoder jwtDecoder;
    @MockitoBean AuditAuthenticationEntryPoint auditAuthenticationEntryPoint;
    @MockitoBean AuditAccessDeniedHandler auditAccessDeniedHandler;

    @BeforeEach
    void setupSecurityMocks() throws Exception {
        Mockito.doAnswer(inv -> {
            HttpServletResponse resp = inv.getArgument(1);
            resp.setStatus(401);
            return null;
        }).when(auditAuthenticationEntryPoint).commence(any(), any(), any());

        Mockito.doAnswer(inv -> {
            HttpServletResponse resp = inv.getArgument(1);
            resp.setStatus(403);
            return null;
        }).when(auditAccessDeniedHandler).handle(any(), any(), any());
    }

    private AuditLog sampleLog() {
        AuditLog log = new AuditLog();
        log.setId(1L);
        log.setTimestamp(OffsetDateTime.parse("2026-05-11T10:00:00Z"));
        log.setActionType(AuditActionType.USER_LOGIN);
        log.setActorUsername("alice");
        log.setOutcome(Outcome.SUCCESS);
        log.setResourceId(null);
        return log;
    }

    @Test
    void searchAuditLogsReturnsEntriesForAdmin() throws Exception {
        given(auditService.search(isNull(), isNull(), isNull(), isNull()))
            .willReturn(List.of(sampleLog()));

        mvc.perform(get("/api/admin/audit-logs")
                .with(MockUserFactory.jwtAsAdmin("admin")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].actionType").value("USER_LOGIN"))
            .andExpect(jsonPath("$[0].actorUsername").value("alice"))
            .andExpect(jsonPath("$[0].outcome").value("SUCCESS"));
    }

    @Test
    void searchAuditLogsReturns400ForUnknownActionType() throws Exception {
        mvc.perform(get("/api/admin/audit-logs")
                .with(MockUserFactory.jwtAsAdmin("admin"))
                .param("actionType", "USER_LOIGN"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void searchAuditLogsFiltersOnActionType() throws Exception {
        given(auditService.search(any(), isNull(), isNull(), isNull()))
            .willReturn(List.of(sampleLog()));

        mvc.perform(get("/api/admin/audit-logs")
                .with(MockUserFactory.jwtAsAdmin("admin"))
                .param("actionType", "USER_LOGIN"))
            .andExpect(status().isOk());

        verify(auditService).search(AuditActionType.USER_LOGIN, null, null, null);
    }

    @Test
    void searchAuditLogsReturns403ForRegularUser() throws Exception {
        mvc.perform(get("/api/admin/audit-logs")
                .with(MockUserFactory.jwtAs("alice")))
            .andExpect(status().isForbidden());
    }

    @Test
    void getActionTypesReturnsListForAdmin() throws Exception {
        given(auditService.actionTypes()).willReturn(List.of("USER_LOGIN", "TODO_CREATED"));

        mvc.perform(get("/api/admin/audit-logs/action-types")
                .with(MockUserFactory.jwtAsAdmin("admin")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0]").value("USER_LOGIN"));
    }

    @Test
    void deleteAuditLogsReturns204ForAdmin() throws Exception {
        mvc.perform(delete("/api/admin/audit-logs")
                .with(MockUserFactory.jwtAsAdmin("admin")))
            .andExpect(status().isNoContent());

        verify(auditService).clearAll();
    }

    @Test
    void deleteAuditLogsReturns403ForRegularUser() throws Exception {
        mvc.perform(delete("/api/admin/audit-logs")
                .with(MockUserFactory.jwtAs("alice")))
            .andExpect(status().isForbidden());
    }
}
