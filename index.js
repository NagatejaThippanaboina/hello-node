const express = require("express");
const session = require("express-session");
const { csrfSync } = require("csrf-sync");
const db = require("./models");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "todo-app-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
    },
  }),
);

const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: (req) => {
    if (req.is("application/x-www-form-urlencoded")) {
      return req.body._csrf;
    }

    return req.headers["x-csrf-token"];
  },
});

app.use(csrfSynchronisedProtection);

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/todos", async (req, res) => {
  try {
    const todos = await db.Todo.findAll();

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
    res.status(500).send(error.message);
  }
});

app.post("/todos", async (req, res) => {
  try {
    const { title, dueDate } = req.body;

    if (!title || !title.trim() || !dueDate) {
      return res.status(400).json({
        error: "Title and due date are required",
      });
    }

    await db.Todo.create({
      title: title.trim(),
      dueDate,
      completed: false,
    });

    res.redirect("/todos");
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.put("/todos/:id", async (req, res) => {
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

    const todo = await db.Todo.findByPk(id);

    if (!todo) {
      return res.status(404).json({
        error: "Todo not found",
      });
    }

    await todo.setCompletionStatus(completed);

    res.json(todo);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.delete("/todos/:id", async (req, res) => {
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
      },
    });

    res.json(deleted > 0);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

if (require.main === module) {
  app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
  });
}

module.exports = app;
