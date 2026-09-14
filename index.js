const express = require("express");
const db = require("./models");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

    const overdue = todos.filter(
      (todo) => todo.dueDate < todayString && !todo.completed,
    );

    const dueToday = todos.filter(
      (todo) => todo.dueDate === todayString && !todo.completed,
    );

    const dueLater = todos.filter(
      (todo) => todo.dueDate > todayString && !todo.completed,
    );

    res.render("index", {
      overdue,
      dueToday,
      dueLater,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/todos", async (req, res) => {
  try {
    await db.Todo.create({
      title: req.body.title,
      dueDate: req.body.dueDate,
      completed: false,
    });

    res.redirect("/todos");
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.delete("/todos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

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
  app.listen(3000, () => {
    console.log("Server running on port 3000");
  });
}

module.exports = app;
