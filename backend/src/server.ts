
import { app } from "./app";
import { env } from "./config/env";
import { db } from "./config/database";
import { initializeDatabase } from "./db/schema";
import { seedAdmin } from "./db/seedAdmin";

const startServer = async (): Promise<void> => {
    initializeDatabase();
    await seedAdmin();

    const server = app.listen(env.PORT, () => {
        console.log(
            `Game Blog API running on http://localhost:${env.PORT}`
        );
    });

    const shutdown = (signal: string): void => {
        console.log(`${signal} received. Shutting down...`);

        server.close(() => {
            db.close();
            process.exit(0);
        });

        setTimeout(() => {
            process.exit(1);
        }, 10000).unref();
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer().catch((error: unknown) => {
    console.error("Sunucu başlatılamadı:", error);
    db.close();
    process.exit(1);
});