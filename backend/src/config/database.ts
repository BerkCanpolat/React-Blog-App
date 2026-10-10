import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

import { env } from "./env";

const databasePath = path.resolve(
    process.cwd(),
    env.DATABASE_PATH
);

const databaseDirectory =
    path.dirname(databasePath);

if (!fs.existsSync(databaseDirectory)) {
    fs.mkdirSync(databaseDirectory, {
        recursive: true,
    });
}

export const db = new Database(databasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");