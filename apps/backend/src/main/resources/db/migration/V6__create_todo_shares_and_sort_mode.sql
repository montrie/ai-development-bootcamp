CREATE TABLE todo_shares (
  id                BIGSERIAL PRIMARY KEY,
  todo_id           BIGINT NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  recipient_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (todo_id, recipient_user_id)
);

ALTER TABLE users
  ADD COLUMN sort_mode    VARCHAR  NOT NULL DEFAULT 'CREATED_ASC',
  ADD COLUMN custom_order BIGINT[] NOT NULL DEFAULT '{}';
