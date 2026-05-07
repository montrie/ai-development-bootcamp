package com.todo.controller;

import com.todo.config.AdminSeeder;
import com.todo.model.Role;
import com.todo.model.User;
import com.todo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

class V3AdminSeederTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private AdminSeeder adminSeeder;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        adminSeeder = new AdminSeeder(userRepository, passwordEncoder);
        ReflectionTestUtils.setField(adminSeeder, "adminUsername", "admin");
        ReflectionTestUtils.setField(adminSeeder, "adminPassword", "changeme");
    }

    @Test
    void createsAdminWhenNoneExists() {
        given(userRepository.existsByRole(Role.ADMIN)).willReturn(false);
        given(passwordEncoder.encode("changeme")).willReturn("$2a$hashed");

        adminSeeder.run();

        verify(userRepository).save(argThat(user ->
                Role.ADMIN.equals(user.getRole()) && "$2a$hashed".equals(user.getPasswordHash())
        ));
    }

    @Test
    void doesNotCreateAdminWhenOneAlreadyExists() {
        given(userRepository.existsByRole(Role.ADMIN)).willReturn(true);

        adminSeeder.run();

        verify(userRepository, never()).save(argThat((User u) -> Role.ADMIN.equals(u.getRole())));
    }
}
