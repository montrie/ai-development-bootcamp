CREATE TABLE IF NOT EXISTS todos (
    id         BIGSERIAL    PRIMARY KEY,
    text       TEXT         NOT NULL,
    done       BOOLEAN      NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
