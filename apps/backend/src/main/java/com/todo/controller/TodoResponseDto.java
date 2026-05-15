package com.todo.controller;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.todo.model.Todo;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class TodoResponseDto {

    private final Long id;
    private final String text;
    private final boolean done;
    private final LocalDate dueDate;
    private final OffsetDateTime createdAt;
    private final String sharedBy;

    public TodoResponseDto(Todo todo, String sharedBy) {
        this.id = todo.getId();
        this.text = todo.getText();
        this.done = todo.isDone();
        this.dueDate = todo.getDueDate();
        this.createdAt = todo.getCreatedAt();
        this.sharedBy = sharedBy;
    }

    public Long getId() { return id; }
    public String getText() { return text; }
    public boolean isDone() { return done; }
    public LocalDate getDueDate() { return dueDate; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public String getSharedBy() { return sharedBy; }
}
