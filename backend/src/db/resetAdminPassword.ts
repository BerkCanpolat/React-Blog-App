import bcrypt from "bcryptjs";
import { db } from "../config/database";
import { env } from "../config/env";

const resetAdminPassword = async (): Promise<void> => {
    const email = env.ADMIN_EMAIL.trim().toLowerCase();

    const admin = db.prepare(`
        SELECT id, role
        FROM users
        WHERE email = ?
    `).get(email) as
        | { id: number; role: "user" | "admin" }
        | undefined;

    if (!admin) {
        throw new Error(
            "Bu e-posta ile kullanıcı bulunamadı. Önce admin hesabını kontrol edin."
        );
    }

    if (admin.role !== "admin") {
        throw new Error(
            "Bulunan hesap admin değil. İşlem iptal edildi."
        );
    }

    const passwordHash = await bcrypt.hash(
        env.ADMIN_PASSWORD,
        12
    );

    db.prepare(`
        UPDATE users
        SET password_hash = ?,
            is_active = 1,
            updated_at = ?
        WHERE id = ?
    `).run(
        passwordHash,
        new Date().toISOString(),
        admin.id
    );

    // Mevcut refresh oturumlarını geçersiz kıl.
    db.prepare(`
        UPDATE refresh_sessions
        SET revoked_at = ?
        WHERE user_id = ? AND revoked_at IS NULL
    `).run(new Date().toISOString(), admin.id);

    console.log("Admin şifresi güncellendi.");
};

resetAdminPassword()
    .catch((error: unknown) => {
        console.error("Admin şifresi güncellenemedi:", error);
        process.exitCode = 1;
    })
    .finally(() => {
        db.close();
    });