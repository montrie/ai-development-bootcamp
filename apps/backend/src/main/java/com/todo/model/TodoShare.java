package com.todo.model;

import jakarta.persistence.*;

@Entity
@Table(name = "todo_shares")
public class TodoShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "todo_id", nullable = false)
    private Todo todo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_user_id", nullable = false)
    private User recipientUser;

    public Long getId() { return id; }
    public Todo getTodo() { return todo; }
    public void setTodo(Todo todo) { this.todo = todo; }
    public User getRecipientUser() { return recipientUser; }
    public void setRecipientUser(User recipientUser) { this.recipientUser = recipientUser; }
}
