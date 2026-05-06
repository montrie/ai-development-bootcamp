package com.todo.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.DelegatingSecurityContextRepository;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;

@TestConfiguration
@EnableWebSecurity
public class TestSecurityConfig {

    /*
     * Minimal stateless filter chain for @WebMvcTest:
     * - Requires authentication for every request (401 if none)
     * - Uses RequestAttributeSecurityContextRepository so the jwt() MockMvc post-processor's
     *   context (stored as a request attribute) is loaded into SecurityContextHolder
     * - oauth2ResourceServer().jwt() activates BearerTokenAuthenticationFilter and the
     *   401 BearerTokenAuthenticationEntryPoint; actual JWT decoding is bypassed by jwt()
     */
    @Bean
    @Order(1)
    public SecurityFilterChain testFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .securityContext(sc -> sc
                .securityContextRepository(new DelegatingSecurityContextRepository(
                    new RequestAttributeSecurityContextRepository(),
                    new HttpSessionSecurityContextRepository()
                )))
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
        return http.build();
    }
}
