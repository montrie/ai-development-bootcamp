package com.todo.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "username", nullable = false, unique = true)
    private String username;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role = Role.USER;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "sort_mode", nullable = false)
    private SortMode sortMode = SortMode.CREATED_ASC;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "custom_order", nullable = false, columnDefinition = "bigint[]")
    private Long[] customOrder = new Long[]{};

    @PrePersist
    private void prePersist() {
        createdAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public SortMode getSortMode() { return sortMode; }
    public void setSortMode(SortMode sortMode) { this.sortMode = sortMode; }
    public Long[] getCustomOrder() { return customOrder; }
    public void setCustomOrder(Long[] customOrder) { this.customOrder = customOrder; }
}
