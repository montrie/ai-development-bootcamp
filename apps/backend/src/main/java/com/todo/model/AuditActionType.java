package com.todo.model;

public enum AuditActionType {
    TODO_CREATED,
    TODO_TOGGLED,
    TODO_DELETED,
    USER_REGISTERED,
    USER_LOGIN,
    ADMIN_DELETE_USER,
    ADMIN_RESET_PASSWORD,
    ACCESS_DENIED
}
