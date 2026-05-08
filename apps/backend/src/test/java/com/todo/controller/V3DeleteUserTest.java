package com.todo.controller;

import com.todo.service.JwtService;
import com.todo.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@WithMockUser(roles = "ADMIN")
class V3DeleteUserTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    UserService userService;

    @MockitoBean
    JwtService jwtService;

    @Test
    void deleteExistingUserReturns204() throws Exception {
        mvc.perform(delete("/api/admin/users/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteNonExistentUserReturns404() throws Exception {
        doThrow(new UserService.UserNotFoundException(99L))
                .when(userService).deleteUser(99L);

        mvc.perform(delete("/api/admin/users/99"))
                .andExpect(status().isNotFound());
    }
}
