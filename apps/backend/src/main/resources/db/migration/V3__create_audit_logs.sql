CREATE TABLE audit_logs (
    id             BIGSERIAL    PRIMARY KEY,
    timestamp      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    action_type    TEXT         NOT NULL,
    actor_username TEXT         NOT NULL,
    outcome        TEXT         NOT NULL,
    resource_id    BIGINT
);
