import { db } from "../config/database";

export const initializeDatabase = (): void => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            email TEXT NOT NULL UNIQUE,

            password_hash TEXT NOT NULL,

            role TEXT NOT NULL DEFAULT 'user'
                CHECK (role IN ('user', 'admin')),

            is_active INTEGER NOT NULL DEFAULT 1
                CHECK (is_active IN (0, 1)),

            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_users_email
        ON users(email);

        CREATE INDEX IF NOT EXISTS idx_users_role
        ON users(role);


        CREATE TABLE IF NOT EXISTS refresh_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_id INTEGER NOT NULL,

            token_hash TEXT NOT NULL UNIQUE,

            expires_at TEXT NOT NULL,

            revoked_at TEXT,

            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (user_id)
                REFERENCES users(id)
                ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_refresh_sessions_user_id
        ON refresh_sessions(user_id);

        CREATE INDEX IF NOT EXISTS idx_refresh_sessions_token_hash
        ON refresh_sessions(token_hash);


        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL UNIQUE,

            slug TEXT NOT NULL UNIQUE,

            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_categories_slug
        ON categories(slug);


        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL UNIQUE,

            slug TEXT NOT NULL UNIQUE,

            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_tags_slug
        ON tags(slug);


        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            title TEXT NOT NULL,

            slug TEXT NOT NULL UNIQUE,

            excerpt TEXT NOT NULL,

            content TEXT NOT NULL,

            cover_image_url TEXT,

            status TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'published')),

            views INTEGER NOT NULL DEFAULT 0,

            is_featured INTEGER NOT NULL DEFAULT 0
                CHECK (is_featured IN (0, 1)),

            author_id INTEGER NOT NULL,

            category_id INTEGER NOT NULL,

            published_at TEXT,

            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (author_id)
                REFERENCES users(id)
                ON DELETE RESTRICT,

            FOREIGN KEY (category_id)
                REFERENCES categories(id)
                ON DELETE RESTRICT
        );

        CREATE INDEX IF NOT EXISTS idx_posts_slug
        ON posts(slug);

        CREATE INDEX IF NOT EXISTS idx_posts_status
        ON posts(status);

        CREATE INDEX IF NOT EXISTS idx_posts_category_id
        ON posts(category_id);

        CREATE INDEX IF NOT EXISTS idx_posts_author_id
        ON posts(author_id);

        CREATE INDEX IF NOT EXISTS idx_posts_created_at
        ON posts(created_at);

        CREATE INDEX IF NOT EXISTS idx_posts_views
        ON posts(views);


        CREATE TABLE IF NOT EXISTS post_tags (
            post_id INTEGER NOT NULL,

            tag_id INTEGER NOT NULL,

            PRIMARY KEY (post_id, tag_id),

            FOREIGN KEY (post_id)
                REFERENCES posts(id)
                ON DELETE CASCADE,

            FOREIGN KEY (tag_id)
                REFERENCES tags(id)
                ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id
        ON post_tags(tag_id);


        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            content TEXT NOT NULL,

            user_id INTEGER NOT NULL,

            post_id INTEGER NOT NULL,

            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (user_id)
                REFERENCES users(id)
                ON DELETE CASCADE,

            FOREIGN KEY (post_id)
                REFERENCES posts(id)
                ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_comments_post_id
        ON comments(post_id);

        CREATE INDEX IF NOT EXISTS idx_comments_user_id
        ON comments(user_id);

        CREATE INDEX IF NOT EXISTS idx_comments_created_at
        ON comments(created_at);


        CREATE TABLE IF NOT EXISTS post_views (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            post_id INTEGER NOT NULL,

            visitor_id TEXT NOT NULL,

            view_date TEXT NOT NULL,

            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

            UNIQUE(post_id, visitor_id, view_date),

            FOREIGN KEY (post_id)
                REFERENCES posts(id)
                ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_post_views_post_id
        ON post_views(post_id);

        CREATE INDEX IF NOT EXISTS idx_post_views_view_date
        ON post_views(view_date);
    `);
};