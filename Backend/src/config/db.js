const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(
  path.join(__dirname, "../database/database.sqlite"),
  (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("SQLite Connected");
    }
  }
);

db.serialize(() => {
  db.run(`
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT
        )
    `);

  db.run(`
        CREATE TABLE IF NOT EXISTS posts(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            content TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

module.exports = db;