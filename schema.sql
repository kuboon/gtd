CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    idp_sub TEXT, -- subject from the id.kbn.one identity provider (null = legacy anonymous)
    push_subscription TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_idp_sub ON users(idp_sub);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    list TEXT NOT NULL, -- 'inbox', 'now', 'next', 'waiting', 'done'
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS task_logs (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    from_list TEXT,
    to_list TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);
