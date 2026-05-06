package com.todo.support;

import com.todo.model.User;
import com.todo.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.Optional;

import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

public final class MockUserFactory {

    private MockUserFactory() {}

    /**
     * Creates a User with the default @WithMockUser username ("user"), wires it into the
     * UserRepository mock, and returns it so callers can use it in further stubs.
     */
    public static User mockDefaultUser(UserRepository userRepository) {
        User user = new User();
        user.setUsername("user");
        given(userRepository.findByUsername("user")).willReturn(Optional.of(user));
        return user;
    }

    /**
     * Returns a MockMvc RequestPostProcessor that authenticates requests as the given username
     * with ROLE_USER, simulating a valid JWT. Use this instead of @WithMockUser so that
     * Authentication is correctly injected into controller method parameters.
     */
    public static RequestPostProcessor jwtAs(String username) {
        return jwt()
                .jwt(j -> j.subject(username))
                .authorities(new SimpleGrantedAuthority("ROLE_USER"));
    }
}
