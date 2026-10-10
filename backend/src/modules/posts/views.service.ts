
import { createHash } from "node:crypto";
import { db } from "../../config/database";
import { AppError } from "../../utils/AppError";

const hashVisitorId = (visitorId: string): string =>
    createHash("sha256").update(visitorId).digest("hex");

export const recordPostView = (
    postId: number,
    visitorId: string
): { views: number; counted: boolean } => {
    const post = db.prepare(`
        SELECT id
        FROM posts
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

    const visitorHash = hashVisitorId(visitorId);
    const today = new Date().toISOString().slice(0, 10);

    const recordTransaction = db.transaction(() => {
        const result = db.prepare(`
            INSERT OR IGNORE INTO post_views (
                post_id, visitor_id, view_date, created_at
            )
            VALUES (?, ?, ?, ?)
        `).run(
            postId,
            visitorHash,
            today,
            new Date().toISOString()
        );

        const counted = result.changes === 1;

        if (counted) {
            db.prepare(`
                UPDATE posts
                SET views = views + 1
                WHERE id = ?
            `).run(postId);
        }

        const updatedPost = db.prepare(`
            SELECT views FROM posts WHERE id = ?
        `).get(postId) as { views: number };

        return {
            views: updatedPost.views,
            counted,
        };
    });

    return recordTransaction();
};