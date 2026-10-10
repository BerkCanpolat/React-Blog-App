
import { db } from "../../config/database";
import { AppError } from "../../utils/AppError";

export interface Category {
    id: number;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
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
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

const findById = (id: number): Category | undefined => {
    return db.prepare(`
        SELECT id, name, slug, created_at, updated_at
        FROM categories
        WHERE id = ?
    `).get(id) as Category | undefined;
};

const ensureUniqueSlug = (
    baseSlug: string,
    excludeId?: number
): string => {
    const base = baseSlug || "category";
    let slug = base;
    let suffix = 2;

    while (true) {
        const existing = excludeId === undefined
            ? db.prepare(
                "SELECT id FROM categories WHERE slug = ?"
            ).get(slug)
            : db.prepare(
                "SELECT id FROM categories WHERE slug = ? AND id != ?"
            ).get(slug, excludeId);

        if (!existing) {
            return slug;
        }

        slug = `${base}-${suffix}`;
        suffix += 1;
    }
};

export const listCategories = (): Category[] => {
    return db.prepare(`
        SELECT id, name, slug, created_at, updated_at
        FROM categories
        ORDER BY name COLLATE NOCASE ASC
    `).all() as Category[];
};

export const getCategoryBySlug = (
    slug: string
): Category => {
    const category = db.prepare(`
        SELECT id, name, slug, created_at, updated_at
        FROM categories
        WHERE slug = ?
    `).get(slug) as Category | undefined;

    if (!category) {
        throw new AppError(
            "Kategori bulunamadı.",
            404,
            "CATEGORY_NOT_FOUND"
        );
    }

    return category;
};

export const createCategory = (
    name: string
): Category => {
    const slug = ensureUniqueSlug(slugify(name));

    try {
        const result = db.prepare(`
            INSERT INTO categories (name, slug)
            VALUES (?, ?)
        `).run(name, slug);

        const category = findById(
            Number(result.lastInsertRowid)
        );

        if (!category) {
            throw new AppError(
                "Kategori oluşturulamadı.",
                500,
                "CATEGORY_CREATION_FAILED"
            );
        }

        return category;
    } catch (error) {
        if (
            error instanceof Error &&
            "code" in error &&
            error.code === "SQLITE_CONSTRAINT_UNIQUE"
        ) {
            throw new AppError(
                "Bu kategori adı zaten kullanılıyor.",
                409,
                "CATEGORY_ALREADY_EXISTS"
            );
        }

        throw error;
    }
};

export const updateCategory = (
    id: number,
    name: string
): Category => {
    const current = findById(id);

    if (!current) {
        throw new AppError(
            "Kategori bulunamadı.",
            404,
            "CATEGORY_NOT_FOUND"
        );
    }

    const slug = ensureUniqueSlug(
        slugify(name),
        id
    );

    try {
        db.prepare(`
            UPDATE categories
            SET name = ?,
                slug = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(name, slug, id);

        const updated = findById(id);

        if (!updated) {
            throw new AppError(
                "Kategori güncellenemedi.",
                500,
                "CATEGORY_UPDATE_FAILED"
            );
        }

        return updated;
    } catch (error) {
        if (
            error instanceof Error &&
            "code" in error &&
            error.code === "SQLITE_CONSTRAINT_UNIQUE"
        ) {
            throw new AppError(
                "Bu kategori adı zaten kullanılıyor.",
                409,
                "CATEGORY_ALREADY_EXISTS"
            );
        }

        throw error;
    }
};

export const deleteCategory = (id: number): void => {
    const category = findById(id);

    if (!category) {
        throw new AppError(
            "Kategori bulunamadı.",
            404,
            "CATEGORY_NOT_FOUND"
        );
    }

    const postsCount = db.prepare(`
        SELECT COUNT(*) AS count
        FROM posts
        WHERE category_id = ?
    `).get(id) as { count: number };

    if (postsCount.count > 0) {
        throw new AppError(
            "Bu kategoriye bağlı yazılar var. Önce yazıları başka bir kategoriye taşıyın.",
            409,
            "CATEGORY_HAS_POSTS"
        );
    }

    db.prepare(`
        DELETE FROM categories
        WHERE id = ?
    `).run(id);
};