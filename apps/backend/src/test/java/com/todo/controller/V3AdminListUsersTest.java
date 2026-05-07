package com.todo.controller;

import com.todo.config.SecurityConfig;
import com.todo.model.Role;
import com.todo.model.User;
import com.todo.service.JwtService;
import com.todo.service.UserService;
import com.todo.support.MockUserFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AdminController.class)
@Import(SecurityConfig.class)
class V3AdminListUsersTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    UserService userService;

    @MockitoBean
    JwtService jwtService;

    @MockitoBean
    JwtDecoder jwtDecoder;

    @Test
    void listUsersReturnsAllUsers() throws Exception {
        User alice = new User();
        alice.setUsername("alice");
        alice.setRole(Role.USER);
        alice.setPasswordHash("irrelevant");

        given(userService.listUsers()).willReturn(List.of(alice));

        mvc.perform(get("/api/admin/users")
                        .with(MockUserFactory.jwtAsAdmin("admin")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("alice"))
                .andExpect(jsonPath("$[0].role").value("USER"))
                .andExpect(jsonPath("$[0].passwordHash").doesNotExist());
    }

    @Test
    void listUsersForRegularUserReturns403() throws Exception {
        mvc.perform(get("/api/admin/users")
                        .with(MockUserFactory.jwtAs("alice")))
                .andExpect(status().isForbidden());
    }
}
