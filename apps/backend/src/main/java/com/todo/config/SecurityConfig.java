package com.todo.config;

import com.todo.security.AuditAccessDeniedHandler;
import com.todo.security.AuditAuthenticationEntryPoint;
import com.todo.service.JwtService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.DelegatingSecurityContextRepository;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtService jwtService;
    private final AuditAuthenticationEntryPoint auditAuthenticationEntryPoint;
    private final AuditAccessDeniedHandler auditAccessDeniedHandler;

    public SecurityConfig(JwtService jwtService,
                          AuditAuthenticationEntryPoint auditAuthenticationEntryPoint,
                          AuditAccessDeniedHandler auditAccessDeniedHandler) {
        this.jwtService = jwtService;
        this.auditAuthenticationEntryPoint = auditAuthenticationEntryPoint;
        this.auditAccessDeniedHandler = auditAccessDeniedHandler;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtDecoder jwtDecoder) throws Exception {
        http
            // No CSRF needed for a stateless JWT API
            .csrf(AbstractHttpConfigurer::disable)
            // JWT is validated per-request; no server-side session is created or consulted
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            /*
             * Delegate security context storage: RequestAttributeSecurityContextRepository is
             * checked first (thread-safe, request-scoped), with HttpSessionSecurityContextRepository
             * as fallback so filters that write to the session still work with STATELESS policy.
             */
            .securityContext(sc -> sc
                .securityContextRepository(new DelegatingSecurityContextRepository(
                    new RequestAttributeSecurityContextRepository(),
                    new HttpSessionSecurityContextRepository()
                )))
            .authorizeHttpRequests(auth -> auth
                // Auth endpoints are public so unauthenticated users can register/login
                .requestMatchers("/api/auth/**").permitAll()
                // All /api/admin/** routes require ROLE_ADMIN regardless of HTTP method
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/todos").hasRole("ADMIN")
                .requestMatchers("/api/todos/**", "/api/todos").hasRole("USER") // /** alone does not match the base path
                // anyRequest covers everything else, including /api/users/**
                .anyRequest().authenticated()
            )
            // Log and respond to 401/403 via our audit-aware handlers
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(auditAuthenticationEntryPoint)
                .accessDeniedHandler(auditAccessDeniedHandler)
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .decoder(jwtDecoder)
                    .jwtAuthenticationConverter(createJwtAuthConverter())
                )
            );
        return http.build();
    }

    /*
     * Spring's default converter reads the 'scope'/'scp' claim with a 'SCOPE_' prefix.
     * Override to read our custom 'role' claim with 'ROLE_' so hasRole("USER") resolves correctly.
     */
    @Bean
    public JwtAuthenticationConverter createJwtAuthConverter() {
        JwtGrantedAuthoritiesConverter authoritiesConverter = new JwtGrantedAuthoritiesConverter();
        authoritiesConverter.setAuthoritiesClaimName("role");
        authoritiesConverter.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authoritiesConverter);
        return converter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Exposed as a bean so @WebMvcTest can inject a JwtDecoder without duplicating the one already wired in the filter chain
    @Bean
    public JwtDecoder jwtDecoder() {
        return jwtService.jwtDecoder();
    }
}
