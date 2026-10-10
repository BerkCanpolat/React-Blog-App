
import bcrypt from "bcryptjs";
import { db } from "../config/database";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export const seedAdmin = async (): Promise<void> => {
    const email = env.ADMIN_EMAIL.trim().toLowerCase();

    const existing = db.prepare(`
        SELECT id, role FROM users WHERE email = ?
    `).get(email) as
        | { id: number; role: "user" | "admin" }
        | undefined;

    if (existing) {
        if (existing.role !== "admin") {
            throw new AppError(
                "ADMIN_EMAIL normal kullanıcı hesabına ait. Farklı bir admin e-postası belirleyin.",
                500,
                "ADMIN_EMAIL_CONFLICT"
            );
        }

        console.log("Admin hesabı mevcut.");
        return;
    }

    const passwordHash = await bcrypt.hash(
        env.ADMIN_PASSWORD,
        12
    );
    const now = new Date().toISOString();

    db.prepare(`
        INSERT INTO users (
            name, email, password_hash, role,
            is_active, created_at, updated_at
        )
        VALUES (?, ?, ?, 'admin', 1, ?, ?)
    `).run(
        env.ADMIN_NAME,
        email,
        passwordHash,
        now,
        now
    );

    console.log("Admin hesabı oluşturuldu.");
};