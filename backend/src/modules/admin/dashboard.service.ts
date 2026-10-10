
import { db } from "../../config/database";

interface CountRow {
    total: number;
}

interface RecentPostRow {
    id: number;
    title: string;
    slug: string;
    status: "draft" | "published";
    views: number;
    created_at: string;
    updated_at: string;
    category_name: string;
}

interface RecentCommentRow {
    id: number;
    content: string;
    created_at: string;
    user_name: string;
    post_title: string;
    post_slug: string;
}

const count = (sql: string): number => {
    return (db.prepare(sql).get() as CountRow).total;
};

export const getDashboardStats = () => {
    const totals = {
        users: count(`
            SELECT COUNT(*) AS total
            FROM users
            WHERE is_active = 1
        `),
        posts: count(`
            SELECT COUNT(*) AS total FROM posts
        `),
        publishedPosts: count(`
            SELECT COUNT(*) AS total
            FROM posts
            WHERE status = 'published'
              AND published_at IS NOT NULL
        `),
        drafts: count(`
            SELECT COUNT(*) AS total
            FROM posts
            WHERE status = 'draft'
        `),
        comments: count(`
            SELECT COUNT(*) AS total
            FROM comments
        `),
        views: count(`
            SELECT COALESCE(SUM(views), 0) AS total
            FROM posts
        `),
        categories: count(`
            SELECT COUNT(*) AS total FROM categories
        `),
        tags: count(`
            SELECT COUNT(*) AS total FROM tags
        `),
    };

    const recentPosts = db.prepare(`
        SELECT
            p.id,
            p.title,
            p.slug,
            p.status,
            p.views,
            p.created_at,
            p.updated_at,
            c.name AS category_name
        FROM posts p
        JOIN categories c ON c.id = p.category_id
        ORDER BY p.updated_at DESC
        LIMIT 5
    `).all() as RecentPostRow[];

    const recentComments = db.prepare(`
        SELECT
            cm.id,
            cm.content,
            cm.created_at,
            u.name AS user_name,
            p.title AS post_title,
            p.slug AS post_slug
        FROM comments cm
        JOIN users u ON u.id = cm.user_id
        JOIN posts p ON p.id = cm.post_id
        ORDER BY cm.created_at DESC, cm.id DESC
        LIMIT 5
    `).all() as RecentCommentRow[];

    const popularPosts = db.prepare(`
        SELECT
            p.id,
            p.title,
            p.slug,
            p.views,
            p.published_at,
            c.name AS category_name
        FROM posts p
        JOIN categories c ON c.id = p.category_id
        WHERE p.status = 'published'
          AND p.published_at IS NOT NULL
        ORDER BY p.views DESC, p.published_at DESC
        LIMIT 5
    `).all();

    return {
        totals,
        recentPosts,
        recentComments,
        popularPosts,
    };
};