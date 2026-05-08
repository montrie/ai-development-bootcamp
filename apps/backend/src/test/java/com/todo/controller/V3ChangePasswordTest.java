package com.todo.controller;

import com.todo.config.SecurityConfig;
import com.todo.service.JwtService;
import com.todo.service.UserService;
import com.todo.support.MockUserFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
class V3ChangePasswordTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    UserService userService;

    @MockitoBean
    JwtService jwtService;

    @MockitoBean
    JwtDecoder jwtDecoder;

    @Test
    void changePasswordWithCorrectCurrentPasswordReturns204() throws Exception {
        mvc.perform(patch("/api/users/self/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"secret123\",\"newPassword\":\"newpass456\"}")
                        .with(MockUserFactory.jwtAs("alice")))
                .andExpect(status().isNoContent());
    }

    @Test
    void changePasswordWithWrongCurrentPasswordReturns400() throws Exception {
        doThrow(new UserService.InvalidCurrentPasswordException())
                .when(userService).changeOwnPassword("alice", "wrongpass", "newpass456");

        mvc.perform(patch("/api/users/self/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"wrongpass\",\"newPassword\":\"newpass456\"}")
                        .with(MockUserFactory.jwtAs("alice")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void changePasswordWithoutJwtReturns401() throws Exception {
        mvc.perform(patch("/api/users/self/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"secret123\",\"newPassword\":\"newpass456\"}"))
                .andExpect(status().isUnauthorized());
    }
}
