
import { randomUUID } from "node:crypto";
import { db } from "../../config/database";
import { AppError } from "../../utils/AppError";
import type {
    CreatePostInput,
    UpdatePostInput,
} from "./posts.schema";

type PostStatus = "draft" | "published";

interface PostRow {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    cover_image_url: string | null;
    status: PostStatus;
    views: number;
    is_featured: number;
    author_id: number;
    category_id: number;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    author_name: string;
    category_name: string;
    category_slug: string;
}

interface TagRow {
    id: number;
    name: string;
    slug: string;
}

interface PostFilters {
    page: number;
    limit: number;
    search?: string;
    category?: string;
    tag?: string;
    sort?: "newest" | "oldest" | "popular";
    status?: PostStatus;
}

const slugify = (value: string): string => {
    return value
        .toLocaleLowerCase("tr-TR")
        .replace(/ı/g, "i")
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 180) || "yazi";
};

const createUniqueSlug = (
    title: string,
    excludePostId?: number
): string => {
    const base = slugify(title);
    let slug = base;
    let suffix = 2;

    const statement = db.prepare(`
        SELECT id FROM posts WHERE slug = ?
    `);

    while (true) {
        const existing = statement.get(slug) as
            | { id: number }
            | undefined;

        if (
            !existing ||
            existing.id === excludePostId
        ) {
            return slug;
        }

        slug = `${base}-${suffix}`;
        suffix += 1;
    }
};

const postSelect = `
    SELECT
        p.id,
        p.title,
        p.slug,
        p.excerpt,
        p.content,
        p.cover_image_url,
        p.status,
        p.views,
        p.is_featured,
        p.author_id,
        p.category_id,
        p.published_at,
        p.created_at,
        p.updated_at,
        u.name AS author_name,
        c.name AS category_name,
        c.slug AS category_slug
    FROM posts p
    JOIN users u ON u.id = p.author_id
    JOIN categories c ON c.id = p.category_id
`;

const attachTags = <T extends PostRow>(post: T) => {
    const tags = db.prepare(`
        SELECT t.id, t.name, t.slug
        FROM tags t
        JOIN post_tags pt ON pt.tag_id = t.id
        WHERE pt.post_id = ?
        ORDER BY t.name
    `).all(post.id) as TagRow[];

    return {
        ...post,
        is_featured: post.is_featured === 1,
        tags,
    };
};

const getPostRowById = (
    id: number
): PostRow | undefined => {
    return db.prepare(`
        ${postSelect}
        WHERE p.id = ?
    `).get(id) as PostRow | undefined;
};

const validateRelations = (
    categoryId: number,
    tagIds: number[]
): void => {
    const category = db.prepare(`
        SELECT id FROM categories WHERE id = ?
    `).get(categoryId);

    if (!category) {
        throw new AppError(
            "Kategori bulunamadı.",
            404,
            "CATEGORY_NOT_FOUND"
        );
    }

    if (tagIds.length === 0) return;

    const placeholders = tagIds.map(() => "?").join(",");
    const rows = db.prepare(`
        SELECT id FROM tags WHERE id IN (${placeholders})
    `).all(...tagIds) as { id: number }[];

    if (rows.length !== tagIds.length) {
        throw new AppError(
            "Bir veya daha fazla etiket bulunamadı.",
            404,
            "TAG_NOT_FOUND"
        );
    }
};

const replacePostTags = (
    postId: number,
    tagIds: number[]
): void => {
    db.prepare(`
        DELETE FROM post_tags WHERE post_id = ?
    `).run(postId);

    const insert = db.prepare(`
        INSERT INTO post_tags (post_id, tag_id)
        VALUES (?, ?)
    `);

    for (const tagId of tagIds) {
        insert.run(postId, tagId);
    }
};

const createPostTransaction = db.transaction(
    (input: CreatePostInput, authorId: number) => {
        validateRelations(input.categoryId, input.tagIds);

        const now = new Date().toISOString();
        const slug = createUniqueSlug(input.title);
        const publishedAt =
            input.status === "published" ? now : null;

        const result = db.prepare(`
            INSERT INTO posts (
                title, slug, excerpt, content,
                cover_image_url, status, is_featured,
                author_id, category_id, published_at,
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            input.title,
            slug,
            input.excerpt,
            input.content,
            input.coverImageUrl ?? null,
            input.status,
            input.isFeatured ? 1 : 0,
            authorId,
            input.categoryId,
            publishedAt,
            now,
            now
        );

        const postId = Number(result.lastInsertRowid);
        replacePostTags(postId, input.tagIds);

        return postId;
    }
);

const updatePostTransaction = db.transaction(
    (id: number, input: UpdatePostInput) => {
        const existing = db.prepare(`
            SELECT * FROM posts WHERE id = ?
        `).get(id) as {
            id: number;
            title: string;
            status: PostStatus;
            published_at: string | null;
            category_id: number;
        } | undefined;

        if (!existing) {
            throw new AppError(
                "Blog yazısı bulunamadı.",
                404,
                "POST_NOT_FOUND"
            );
        }

        const categoryId = input.categoryId ?? existing.category_id;
        const tagIds = input.tagIds;

        validateRelations(
            categoryId,
            tagIds ?? (
                db.prepare(`
                    SELECT tag_id FROM post_tags
                    WHERE post_id = ?
                `).all(id) as { tag_id: number }[]
            ).map((row) => row.tag_id)
        );

        const title = input.title ?? existing.title;
        const status = input.status ?? existing.status;
        const slug = input.title
            ? createUniqueSlug(input.title, id)
            : undefined;

        const now = new Date().toISOString();
        let publishedAt = existing.published_at;

        if (status === "published" && !publishedAt) {
            publishedAt = now;
        } else if (status === "draft") {
            publishedAt = null;
        }

        const fields: string[] = [];
        const values: unknown[] = [];

        const add = (column: string, value: unknown) => {
            fields.push(`${column} = ?`);
            values.push(value);
        };

        if (input.title !== undefined) add("title", title);
        if (slug !== undefined) add("slug", slug);
        if (input.excerpt !== undefined) add("excerpt", input.excerpt);
        if (input.content !== undefined) add("content", input.content);
        if (input.coverImageUrl !== undefined) {
            add("cover_image_url", input.coverImageUrl);
        }
        if (input.status !== undefined) add("status", status);
        if (input.isFeatured !== undefined) {
            add("is_featured", input.isFeatured ? 1 : 0);
        }
        if (input.categoryId !== undefined) {
            add("category_id", input.categoryId);
        }

        if (input.status !== undefined || existing.status !== status) {
            add("published_at", publishedAt);
        }

        add("updated_at", now);
        values.push(id);

        db.prepare(`
            UPDATE posts
            SET ${fields.join(", ")}
            WHERE id = ?
        `).run(...values);

        if (tagIds !== undefined) {
            replacePostTags(id, tagIds);
        }

        return id;
    }
);

export const listPublicPosts = (filters: PostFilters) => {
    const {
        page,
        limit,
        search,
        category,
        tag,
        sort = "newest",
    } = filters;

    const conditions = [
        "p.status = 'published'",
        "p.published_at IS NOT NULL",
    ];
    const params: (string | number)[] = [];

    if (search) {
        conditions.push(
            "(p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ?)"
        );
        const term = `%${search}%`;
        params.push(term, term, term);
    }

    if (category) {
        conditions.push("c.slug = ?");
        params.push(category);
    }

    if (tag) {
        conditions.push(`
            EXISTS (
                SELECT 1
                FROM post_tags pt2
                JOIN tags t2 ON t2.id = pt2.tag_id
                WHERE pt2.post_id = p.id AND t2.slug = ?
            )
        `);
        params.push(tag);
    }

    const where = conditions.join(" AND ");
    const orderBy = {
        newest: "p.published_at DESC, p.id DESC",
        oldest: "p.published_at ASC, p.id ASC",
        popular: "p.views DESC, p.published_at DESC",
    }[sort];

    const totalRow = db.prepare(`
        SELECT COUNT(*) AS total
        FROM posts p
        JOIN categories c ON c.id = p.category_id
        WHERE ${where}
    `).get(...params) as { total: number };

    const rows = db.prepare(`
        ${postSelect}
        WHERE ${where}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
    `).all(
        ...params,
        limit,
        (page - 1) * limit
    ) as PostRow[];

    return {
        items: rows.map(attachTags),
        pagination: {
            page,
            limit,
            total: totalRow.total,
            totalPages: Math.ceil(totalRow.total / limit),
        },
    };
};

export const listAdminPosts = (filters: PostFilters) => {
    const { page, limit, search, status } = filters;
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (status) {
        conditions.push("p.status = ?");
        params.push(status);
    }

    if (search) {
        conditions.push("(p.title LIKE ? OR p.excerpt LIKE ?)");
        const term = `%${search}%`;
        params.push(term, term);
    }

    const where = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const totalRow = db.prepare(`
        SELECT COUNT(*) AS total
        FROM posts p
        ${where}
    `).get(...params) as { total: number };

    const rows = db.prepare(`
        ${postSelect}
        ${where}
        ORDER BY p.updated_at DESC
        LIMIT ? OFFSET ?
    `).all(
        ...params,
        limit,
        (page - 1) * limit
    ) as PostRow[];

    return {
        items: rows.map(attachTags),
        pagination: {
            page,
            limit,
            total: totalRow.total,
            totalPages: Math.ceil(totalRow.total / limit),
        },
    };
};

export const getPublicPostBySlug = (slug: string) => {
    const post = db.prepare(`
        ${postSelect}
        WHERE p.slug = ?
          AND p.status = 'published'
          AND p.published_at IS NOT NULL
    `).get(slug) as PostRow | undefined;

    if (!post) {
        throw new AppError(
            "Blog yazısı bulunamadı.",
            404,
            "POST_NOT_FOUND"
        );
    }

    return attachTags(post);
};

export const getAdminPostById = (id: number) => {
    const post = getPostRowById(id);

    if (!post) {
        throw new AppError(
            "Blog yazısı bulunamadı.",
            404,
            "POST_NOT_FOUND"
        );
    }

    return attachTags(post);
};

export const createPost = (
    input: CreatePostInput,
    authorId: number
) => {
    const id = createPostTransaction(input, authorId);
    return getAdminPostById(id);
};

export const updatePost = (
    id: number,
    input: UpdatePostInput
) => {
    updatePostTransaction(id, input);
    return getAdminPostById(id);
};

export const deletePost = (id: number): void => {
    const result = db.prepare(`
        DELETE FROM posts WHERE id = ?
    `).run(id);

    if (result.changes === 0) {
        throw new AppError(
            "Blog yazısı bulunamadı.",
            404,
            "POST_NOT_FOUND"
        );
    }
};