
import { db } from "../../config/database";
import { AppError } from "../../utils/AppError";

interface CommentRow {
    id: number;
    content: string;
    user_id: number;
    post_id: number;
    created_at: string;
    updated_at: string;
    user_name: string;
    post_title: string;
    post_slug: string;
    post_status: "draft" | "published";
}

interface CommentFilters {
    page: number;
    limit: number;
    postId?: number;
}

const commentSelect = `
    SELECT
        cm.id,
        cm.content,
        cm.user_id,
        cm.post_id,
        cm.created_at,
        cm.updated_at,
        u.name AS user_name,
        p.title AS post_title,
        p.slug AS post_slug,
        p.status AS post_status
    FROM comments cm
    JOIN users u ON u.id = cm.user_id
    JOIN posts p ON p.id = cm.post_id
`;

export const listPostComments = (
    postId: number,
    filters: CommentFilters
) => {
    const post = db.prepare(`
        SELECT id FROM posts
        WHERE id = ?
          AND status = 'published'
          AND published_at IS NOT NULL
    `).get(postId);

    if (!post) {
        throw new AppError(
            "Blog yazısı bulunamadı.",
            404,
            "POST_NOT_FOUND"
        );
    }

    const total = db.prepare(`
        SELECT COUNT(*) AS total
        FROM comments
        WHERE post_id = ?
    `).get(postId) as { total: number };

    const items = db.prepare(`
        ${commentSelect}
        WHERE cm.post_id = ?
          AND p.status = 'published'
        ORDER BY cm.created_at DESC, cm.id DESC
        LIMIT ? OFFSET ?
    `).all(
        postId,
        filters.limit,
        (filters.page - 1) * filters.limit
    ) as CommentRow[];

    return {
        items,
        pagination: {
            page: filters.page,
            limit: filters.limit,
            total: total.total,
            totalPages: Math.ceil(total.total / filters.limit),
        },
    };
};

export const listAdminComments = (filters: CommentFilters) => {
    const where = filters.postId
        ? "WHERE cm.post_id = ?"
        : "";
    const params = filters.postId
        ? [filters.postId]
        : [];

    const total = db.prepare(`
        SELECT COUNT(*) AS total
        FROM comments cm
        ${where}
    `).get(...params) as { total: number };

    const items = db.prepare(`
        ${commentSelect}
        ${where}
        ORDER BY cm.created_at DESC, cm.id DESC
        LIMIT ? OFFSET ?
    `).all(
        ...params,
        filters.limit,
        (filters.page - 1) * filters.limit
    ) as CommentRow[];

    return {
        items,
        pagination: {
            page: filters.page,
            limit: filters.limit,
            total: total.total,
            totalPages: Math.ceil(total.total / filters.limit),
        },
    };
};

export const createComment = (
    content: string,
    postId: number,
    userId: number
) => {
    const post = db.prepare(`
        SELECT id FROM posts
        WHERE id = ?
          AND status = 'published'
          AND published_at IS NOT NULL
    `).get(postId);

    if (!post) {
        throw new AppError(
            "Yorum yapılabilecek yayımlanmış yazı bulunamadı.",
            404,
            "POST_NOT_FOUND"
        );
    }

    const now = new Date().toISOString();
    const result = db.prepare(`
        INSERT INTO comments (
            content, user_id, post_id, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?)
    `).run(content, userId, postId, now, now);

    return getCommentById(Number(result.lastInsertRowid));
};

const getCommentById = (id: number) => {
    const comment = db.prepare(`
        ${commentSelect}
        WHERE cm.id = ?
    `).get(id) as CommentRow | undefined;

    if (!comment) {
        throw new AppError(
            "Yorum bulunamadı.",
            404,
            "COMMENT_NOT_FOUND"
        );
    }

    return comment;
};

export const updateComment = (
    id: number,
    content: string,
    requesterId: number,
    isAdmin: boolean
) => {
    const comment = db.prepare(`
        SELECT id, user_id FROM comments WHERE id = ?
    `).get(id) as
        | { id: number; user_id: number }
        | undefined;

    if (!comment) {
        throw new AppError(
            "Yorum bulunamadı.",
            404,
            "COMMENT_NOT_FOUND"
        );
    }

    if (!isAdmin && comment.user_id !== requesterId) {
        throw new AppError(
            "Bu yorumu düzenleme yetkiniz yok.",
            403,
            "FORBIDDEN"
        );
    }

    db.prepare(`
        UPDATE comments
        SET content = ?, updated_at = ?
        WHERE id = ?
    `).run(content, new Date().toISOString(), id);

    return getCommentById(id);
};

export const deleteComment = (
    id: number,
    requesterId: number,
    isAdmin: boolean
): void => {
    const comment = db.prepare(`
        SELECT id, user_id FROM comments WHERE id = ?
    `).get(id) as
        | { id: number; user_id: number }
        | undefined;

    if (!comment) {
        throw new AppError(
            "Yorum bulunamadı.",
            404,
            "COMMENT_NOT_FOUND"
        );
    }

    if (!isAdmin && comment.user_id !== requesterId) {
        throw new AppError(
            "Bu yorumu silme yetkiniz yok.",
            403,
            "FORBIDDEN"
        );
    }

    db.prepare(`
        DELETE FROM comments WHERE id = ?
    `).run(id);
};