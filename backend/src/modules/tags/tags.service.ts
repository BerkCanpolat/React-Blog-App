
import { db } from "../../config/database";
import { AppError } from "../../utils/AppError";

export interface Tag {
    id: number;
    name: string;
    slug: string;
    created_at: string;
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

const findById = (id: number): Tag | undefined => {
    return db.prepare(`
        SELECT id, name, slug, created_at
        FROM tags
        WHERE id = ?
    `).get(id) as Tag | undefined;
};

const ensureUniqueSlug = (
    baseSlug: string,
    excludeId?: number
): string => {
    const base = baseSlug || "tag";
    let slug = base;
    let suffix = 2;

    while (true) {
        const existing = excludeId === undefined
            ? db.prepare(
                "SELECT id FROM tags WHERE slug = ?"
            ).get(slug)
            : db.prepare(
                "SELECT id FROM tags WHERE slug = ? AND id != ?"
            ).get(slug, excludeId);

        if (!existing) {
            return slug;
        }

        slug = `${base}-${suffix}`;
        suffix += 1;
    }
};

export const listTags = (): Tag[] => {
    return db.prepare(`
        SELECT id, name, slug, created_at
        FROM tags
        ORDER BY name COLLATE NOCASE ASC
    `).all() as Tag[];
};

export const getTagBySlug = (slug: string): Tag => {
    const tag = db.prepare(`
        SELECT id, name, slug, created_at
        FROM tags
        WHERE slug = ?
    `).get(slug) as Tag | undefined;

    if (!tag) {
        throw new AppError(
            "Etiket bulunamadı.",
            404,
            "TAG_NOT_FOUND"
        );
    }

    return tag;
};

export const createTag = (name: string): Tag => {
    const slug = ensureUniqueSlug(slugify(name));

    try {
        const result = db.prepare(`
            INSERT INTO tags (name, slug)
            VALUES (?, ?)
        `).run(name, slug);

        const tag = findById(
            Number(result.lastInsertRowid)
        );

        if (!tag) {
            throw new AppError(
                "Etiket oluşturulamadı.",
                500,
                "TAG_CREATION_FAILED"
            );
        }

        return tag;
    } catch (error) {
        if (
            error instanceof Error &&
            "code" in error &&
            error.code === "SQLITE_CONSTRAINT_UNIQUE"
        ) {
            throw new AppError(
                "Bu etiket adı zaten kullanılıyor.",
                409,
                "TAG_ALREADY_EXISTS"
            );
        }

        throw error;
    }
};

export const updateTag = (
    id: number,
    name: string
): Tag => {
    const current = findById(id);

    if (!current) {
        throw new AppError(
            "Etiket bulunamadı.",
            404,
            "TAG_NOT_FOUND"
        );
    }

    const slug = ensureUniqueSlug(
        slugify(name),
        id
    );

    try {
        db.prepare(`
            UPDATE tags
            SET name = ?,
                slug = ?
            WHERE id = ?
        `).run(name, slug, id);

        const updated = findById(id);

        if (!updated) {
            throw new AppError(
                "Etiket güncellenemedi.",
                500,
                "TAG_UPDATE_FAILED"
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
                "Bu etiket adı zaten kullanılıyor.",
                409,
                "TAG_ALREADY_EXISTS"
            );
        }

        throw error;
    }
};

export const deleteTag = (id: number): void => {
    const tag = findById(id);

    if (!tag) {
        throw new AppError(
            "Etiket bulunamadı.",
            404,
            "TAG_NOT_FOUND"
        );
    }

    db.prepare(`
        DELETE FROM tags
        WHERE id = ?
    `).run(id);
};