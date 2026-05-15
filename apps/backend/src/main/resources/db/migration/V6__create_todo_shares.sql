CREATE TABLE todo_shares (
  id                BIGSERIAL PRIMARY KEY,
  todo_id           BIGINT NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  recipient_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (todo_id, recipient_user_id)
);
