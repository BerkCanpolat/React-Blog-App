const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    `
    INSERT INTO users(email,password)
    VALUES(?,?)
    `,
    [email, hashedPassword],
    function (err) {
      if (err) {
        return res.status(400).json({
          message: "User exists",
        });
      }

      res.status(201).json({
        message: "User created",
      });
    }
  );
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  db.get(
    `
    SELECT * FROM users
    WHERE email = ?
    `,
    [email],
    async (err, user) => {
      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const match = await bcrypt.compare(
        password,
        user.password
      );

      if (!match) {
        return res.status(401).json({
          message: "Wrong password",
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      res.json({
        token,
      });
    }
  );
};