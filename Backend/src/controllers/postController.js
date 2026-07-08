const db = require("../config/db");

exports.getPosts = (req, res) => {
  db.all(
    `
    SELECT *
    FROM posts
    ORDER BY createdAt DESC
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      res.json(rows);
    }
  );
};

exports.getPost = (req, res) => {
  db.get(
    `
    SELECT *
    FROM posts
    WHERE id = ?
    `,
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      res.json(row);
    }
  );
};

exports.createPost = (req, res) => {
  const { title, content } = req.body;

  db.run(
    `
    INSERT INTO posts(title, content)
    VALUES(?, ?)
    `,
    [title, content],
    function (err) {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      res.status(201).json({
        id: this.lastID,
      });
    }
  );
};

exports.updatePost = (req, res) => {
  const { title, content } = req.body;

  db.run(
    `
    UPDATE posts
    SET title = ?, content = ?
    WHERE id = ?
    `,
    [title, content, req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      res.json({
        message: "Updated",
      });
    }
  );
};

exports.deletePost = (req, res) => {
  db.run(
    `
    DELETE FROM posts
    WHERE id = ?
    `,
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      res.json({
        message: "Deleted",
      });
    }
  );
};