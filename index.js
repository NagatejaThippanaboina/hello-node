const express = require("express");
const session = require("express-session");
const { csrfSync } = require("csrf-sync");
const passport = require("./config/passport");
const flash = require("connect-flash");
const bcrypt = require("bcrypt");
const db = require("./models");

const app = express();

// =========================
// PRODUCTION PROXY
// =========================

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// =========================
// STATIC FILES
// =========================

app.use(express.static("public"));

// =========================
// BODY PARSERS
// =========================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

// =========================
// SESSION
// =========================

app.use(
  session({
    secret: process.env.SESSION_SECRET || "todo-app-secret",
    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  }),
);

// =========================
// FLASH MESSAGES
// =========================

app.use(flash());

// =========================
// PASSPORT
// =========================

app.use(passport.initialize());

app.use(passport.session());

// =========================
// GLOBAL EJS VARIABLES
// =========================

app.use((req, res, next) => {
  res.locals.messages = [...req.flash("message"), ...req.flash("error")];

  res.locals.currentUser = req.user;

  next();
});
// =========================
// CSRF PROTECTION
// =========================

const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: (req) => {
    return (
      req.body?._csrf ||
      req.headers["x-csrf-token"] ||
      req.headers["x-xsrf-token"]
    );
  },
});

app.use(csrfSynchronisedProtection);

// =========================
// VIEW ENGINE
// =========================

app.set("view engine", "ejs");

// =========================
// AUTHENTICATION MIDDLEWARE
// =========================

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  req.flash("message", "Please sign in to continue.");

  return res.redirect("/login");
}

// =========================
// HOME
// =========================

app.get("/", (req, res) => {
  res.redirect("/todos");
});

// =========================
// SIGN UP PAGE
// =========================

app.get("/signup", (req, res) => {
  res.render("signup", {
    csrfToken: generateToken(req, res),
  });
});

// =========================
// SIGN UP
// =========================

app.post("/signup", async (req, res) => {
  const { firstName, email, password } = req.body;

  try {
    if (!firstName || !firstName.trim()) {
      req.flash("message", "First name cannot be empty.");

      return res.redirect("/signup");
    }

    if (!email || !email.trim()) {
      req.flash("message", "Email cannot be empty.");

      return res.redirect("/signup");
    }

    if (!password || !password.trim()) {
      req.flash("message", "Password cannot be empty.");

      return res.redirect("/signup");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.User.create({
      firstName: firstName.trim(),
      email: email.trim(),
      password: hashedPassword,
    });

    req.flash("message", "Account created successfully.");

    return res.redirect("/login");
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      error.errors.forEach((validationError) => {
        req.flash("message", validationError.message);
      });

      return res.redirect("/signup");
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      req.flash("message", "Email is already registered.");

      return res.redirect("/signup");
    }

    console.error(error);

    req.flash("message", "Unable to create account.");

    return res.redirect("/signup");
  }
});

// =========================
// LOGIN PAGE
// =========================

app.get("/login", (req, res) => {
  res.render("login", {
    csrfToken: generateToken(req, res),
  });
});

// =========================
// LOGIN
// =========================

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    res.redirect("/todos");
  },
);

// =========================
// LOGOUT
// =========================

app.post("/logout", (req, res, next) => {
  req.logout((error) => {
    if (error) {
      return next(error);
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        return next(sessionError);
      }

      res.redirect("/login");
    });
  });
});

// =========================
// SHOW TODOS
// =========================

app.get("/todos", ensureAuthenticated, async (req, res) => {
  try {
    const todos = await db.Todo.findAll({
      where: {
        userId: req.user.id,
      },
    });

    const today = new Date();

    const todayString =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");

    const activeTodos = todos.filter((todo) => !todo.completed);

    const overdue = activeTodos.filter((todo) => todo.dueDate < todayString);

    const dueToday = activeTodos.filter((todo) => todo.dueDate === todayString);

    const dueLater = activeTodos.filter((todo) => todo.dueDate > todayString);

    const completed = todos.filter((todo) => todo.completed);

    res.render("index", {
      overdue,
      dueToday,
      dueLater,
      completed,
      csrfToken: generateToken(req, res),
    });
  } catch (error) {
    console.error(error);

    res.status(500).send(error.message);
  }
});

// =========================
// CREATE TODO
// =========================

app.post("/todos", ensureAuthenticated, async (req, res) => {
  try {
    const { title, dueDate } = req.body;

    await db.Todo.create({
      title,
      dueDate,
      completed: false,
      userId: req.user.id,
    });

    return res.redirect("/todos");
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      error.errors.forEach((validationError) => {
        req.flash("message", validationError.message);
      });

      return res.redirect("/todos");
    }

    console.error(error);

    req.flash("message", "Unable to create Todo.");

    return res.redirect("/todos");
  }
});

// =========================
// UPDATE TODO
// =========================

app.put("/todos/:id", ensureAuthenticated, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const { completed } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid Todo ID",
      });
    }

    if (typeof completed !== "boolean") {
      return res.status(400).json({
        error: "completed must be a boolean",
      });
    }

    const todo = await db.Todo.findOne({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!todo) {
      return res.status(404).json({
        error: "Todo not found",
      });
    }

    await todo.setCompletionStatus(completed);

    return res.json(todo);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message,
    });
  }
});

// =========================
// DELETE TODO
// =========================

app.delete("/todos/:id", ensureAuthenticated, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid Todo ID",
      });
    }

    const deleted = await db.Todo.destroy({
      where: {
        id,
        userId: req.user.id,
      },
    });

    return res.json(deleted > 0);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message,
    });
  }
});

// =========================
// START SERVER
// =========================

if (require.main === module) {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
