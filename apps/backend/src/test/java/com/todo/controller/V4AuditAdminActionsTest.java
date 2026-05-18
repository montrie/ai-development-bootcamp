package com.todo.controller;

import com.todo.aspect.AuditAspect;
import com.todo.config.SecurityConfig;
import com.todo.model.AuditActionType;
import com.todo.model.Outcome;
import com.todo.security.AuditAccessDeniedHandler;
import com.todo.security.AuditAuthenticationEntryPoint;
import com.todo.service.AuditService;
import com.todo.service.JwtService;
import com.todo.service.UserService;
import com.todo.support.MockUserFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@Import({SecurityConfig.class, AuditAspect.class})
@EnableAspectJAutoProxy
class V4AuditAdminActionsTest {

    @Autowired MockMvc mvc;

    @MockitoBean AuditService auditService;
    @MockitoBean UserService userService;
    @MockitoBean JwtService jwtService;
    @MockitoBean JwtDecoder jwtDecoder;
    @MockitoBean AuditAuthenticationEntryPoint auditAuthenticationEntryPoint;
    @MockitoBean AuditAccessDeniedHandler auditAccessDeniedHandler;

    @Test
    void deleteUserLogsAuditEvent() throws Exception {
        mvc.perform(delete("/api/admin/users/5")
                .with(MockUserFactory.jwtAsAdmin("admin")))
            .andExpect(status().isNoContent());

        verify(auditService).log(AuditActionType.ADMIN_DELETE_USER, "admin", Outcome.SUCCESS, 5L);
    }

    @Test
    void deleteUserLogsFailureOutcomeWhenServiceThrows() throws Exception {
        doThrow(new RuntimeException("db error")).when(userService).deleteUser(5L);

        assertThrows(Exception.class, () ->
            mvc.perform(delete("/api/admin/users/5")
                    .with(MockUserFactory.jwtAsAdmin("admin"))));

        verify(auditService).log(AuditActionType.ADMIN_DELETE_USER, "admin", Outcome.FAILURE, 5L);
    }

    @Test
    void resetPasswordLogsAuditEvent() throws Exception {
        mvc.perform(patch("/api/admin/users/5/password")
                .with(MockUserFactory.jwtAsAdmin("admin"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"newPassword\":\"newpass\"}"))
            .andExpect(status().isNoContent());

        verify(auditService).log(AuditActionType.ADMIN_RESET_PASSWORD, "admin", Outcome.SUCCESS, 5L);
    }
}
