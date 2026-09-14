const express = require("express");
const db = require("./models");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/todos", async (req, res) => {
  try {
    const todos = await db.Todo.findAll();

    res.json(todos);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.post("/todos", async (req, res) => {
  try {
    const todo = await db.Todo.create({
      title: req.body.title,
      dueDate: req.body.dueDate,
      completed: false,
    });

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
